#!/usr/bin/env node
import chalk from "chalk";
import commander from "commander";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import templateJs from "./template/template.mjs";
import webpackConfig from "./template/webpack.template.mjs";
import HTMLTemplate from "./template/HTML.template.mjs";
import AppTemplate from "./template/App.template.mjs";
import indexTemplate from "./template/index.template.mjs";
import babelConfig from "./template/Babel.template.mjs";
import gradient from "gradient-string";
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
	if (!projectName) {
		throw new Error(chalk.red("FAILED: No project name provided"));
	}
	const withTypescript = program.typescript;
	return createApp(projectName, withTypescript);

	function createApp(name: string, withTypescript: boolean) {
		const root = path.resolve(name);
		const appName = path.basename(root);

		console.log(
			`${gradient.cristal(
				`Creating a new ${withTypescript && "TypeScript"} React app:`
			)} ${chalk.magentaBright(appName)}.`
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

		return buildFiles(root, withTypescript, appName);
	}

	function writeFile(file: string, content: string, extension: string) {
		const base = process.cwd();
		fs.writeFileSync(`./${file}.${extension}`, content);
		console.log(`${chalk.green(`Created ${file}.${extension} in ${base}`)}`);
	}

	function buildFiles(root: string, withTypescript: boolean, appName: string) {
		try {
			fs.mkdirSync(path.join(root, "/public"));
		} catch (err) {
			throw new Error(
				chalk.redBright(
					`FAILED: Project ${appName} already exists. Choose a different name and try again.`
				)
			);
		}

		console.log(`${chalk.blue("Creating an HTML document")}`);
		process.chdir("public");
		writeFile("index", HTMLTemplate, "html");
		process.chdir(root);
		fs.mkdirSync(path.join(root, "/src"));
		process.chdir("src");
		console.log(`${chalk.blue("Creating script files")}`);
		writeFile("./App", AppTemplate, withTypescript ? "tsx" : "jsx");
		writeFile("./index", indexTemplate, withTypescript ? "tsx" : "jsx");

		console.log(gradient.retro("Installing dependencies..."));
		DEPENDENCIES.forEach((dependency, i) => {
			process.stdout.write(gradient.pastel(`Installing ${dependency}`));
			process.stdout.cursorTo(0);
			installPackage(dependency);
		});

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
			console.log(gradient.fruit("Created tsconfig.json"));
		}
		console.log(
			gradient.summer(
				`SUCCESS: run cd ${appName} && npm run dev to run the app`
			)
		);
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

	function installPackage(dependency: string) {
		execSync("npm install " + dependency, { encoding: "utf-8" });
	}
})();
