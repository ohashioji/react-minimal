#!/usr/bin/env node
import chalk from "chalk";
import commander from "commander";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import templateJs from "./template/template.js";
import webpackConfig from "./template/webpack.template.js";
import HTMLTemplate from "./template/HTML.template.js";
import AppTemplate from "./template/App.template.js";
import indexTemplate from "./template/index.template.js";
import babelConfig from "./template/Babel.template.js";
import chalkAnimation from "chalk-animation";

const DEPENDENCIES = [...Object.keys(templateJs.dependencies)];

(function init() {
	let projectName;
	const program = new commander.Command("minimal-react")
		.version("0.0.1")
		.arguments("<project-directory>")
		.usage(`${chalk.green("<project-directory>")} [options]`)
		.action((name) => {
			projectName = name;
		})
		.option("--typescript", "Use TypeScript")
		.parse(process.argv);
	const withTypescript = program.typescript;
	return createApp(projectName, withTypescript);

	function createApp(name, withTypescript) {
		const root = path.resolve(name);
		const appName = path.basename(root);
		if (withTypescript) {
			console.log(chalk.yellowBright("Detected flag --typescript"));
		}

		console.log(
			`${chalk.blue("Creating a new React app:")} ${
				chalkAnimation.rainbow(appName, 2).text
			}.`
		);
		const packageJson = {
			name: appName,
			version: "0.1.0",
			private: true,
			scripts: {
				dev: "webpack-dev-server --mode development",
			},
		};
		fs.ensureDirSync(appName);
		process.chdir(appName);
		fs.appendFileSync(
			"package.json",
			JSON.stringify(packageJson, null, 4) + os.EOL
		);

		return buildFiles(root, withTypescript);
	}

	function buildFile(file, content, extension) {
		const base = process.cwd();
		fs.writeFileSync(`./${file}.${extension}`, content);
		console.log(`${chalk.green(`Created ${file}.${extension} in ${base}`)}`);
	}

	function buildFiles(root, withTypescript) {
		fs.mkdirSync(path.join(root, "/public"));
		console.log(`${chalk.blue("Creating")} ${chalk.red("document")}.`);
		process.chdir("public");
		fs.writeFileSync("./index.html", HTMLTemplate);
		console.log(`${chalk.green("Created Document")}.`);

		process.chdir(root);
		fs.mkdirSync(path.join(root, "/src"));
		process.chdir("src");
		console.log(`${chalk.blue("Creating")} ${chalk.red("script files")}.`);
		buildFile("./App", AppTemplate, withTypescript ? "tsx" : "jsx");
		console.log();
		buildFile("./index", indexTemplate, withTypescript ? "tsx" : "jsx");

		const packageInstall = new Promise((resolve, reject) => {
			let outputStr = chalkAnimation.rainbow("").start();
			DEPENDENCIES.forEach((dependency, i) => {
				outputStr.replace(dependency);
				setTimeout(() => {
					process.stdout.write(
						chalk.green(`Installing ${chalk.magentaBright(outputStr.text)}`)
					);
				}, 500);

				process.stdout.cursorTo(0);
				installPackage(dependency);
			}, resolve());
		});
		packageInstall.then(() => {
			console.log(`${chalk.green("Installed all dependencies")}.`);
			process.chdir(root);
			fs.writeFileSync("./webpack.config.js", webpackConfig(withTypescript));
			console.log(chalk.green("Created webpack.config.js"));
			fs.writeFileSync("./.babelrc", babelConfig);
			console.log(chalk.green("Created .babelrc"));

			if (withTypescript) {
				console.log(
					chalk.yellowBright(
						"Detected flag --typescript. Generating tsconfig.json"
					)
				);
				genTsConfig();
				console.log(chalk.green("Created tsconfig.json"));
			}
			console.log(
				chalk.greenBright(
					`Successfully created a new React app. Run cd ${projectName} npm run dev to start`
				)
			);
		});
	}

	function genTsConfig() {
		const tsConfig = {
			compilerOptions: {
				outDir: "./dist/",
				noImplicitAny: true,
				module: "es6",
				target: "es5",
				jsx: "react",
				allowJs: true,
				moduleResolution: "node",
				allowSyntheticDefaultImports: true,
			},
		};

		fs.writeFileSync("./tsconfig.json", JSON.stringify(tsConfig, null, 4));
	}

	function installPackage(dependency) {
		execSync("npm install " + dependency, { encoding: "utf-8" });
	}
})();
