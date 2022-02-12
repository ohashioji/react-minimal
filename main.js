#!/usr/bin/env node
import chalk from "chalk";
import commander from "commander";
import fs from "fs-extra";
import path from "path";
import os from "os";

import { execSync } from "child_process";
import templateJs from "./template/template.js";

const HTML_BASE = `<!DOCTYPE html> <html lang='en'><head>
		<meta charset='UTF-8' />
		<meta http-equiv='X-UA-Compatible' content='IE=edge' />
		<meta name='viewport' content='width=device-width, initial-scale=1.0' />
		<title>Document</title>
	</head>

	<body>
		<div id='root'></div>
	</body>
	<script src='../dist/bundle.js'></script>
</html>`;

const APP_BASE = `import React from "react";
export default function App() {
    return (
        <div>
            <h1>React Minimal</h1>
        </div>
    );
}`;

const INDEX_BASE = `import App from "./App";
import React from "react";
import ReactDom from "react-dom";
ReactDom.render(<App />, document.getElementById("root"));
`;

const WEBPACK = `const path = require("path");
const webpack = require("webpack");

module.exports = {
	entry: "./src/index.tsx",
	mode: "development",
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				loader: "babel-loader",
				options: { presets: ["@babel/env"] },
			},
			{
				test: /\.(ts|tsx)$/,
				exclude: /node_modules/,
				loader: "ts-loader",
			},
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader"],
			},
		],
	},
	resolve: { extensions: [".css", ".js", ".jsx", ".ts", ".tsx"] },
	output: {
		path: path.resolve(__dirname, "dist/"),
		publicPath: "/dist/",
		filename: "bundle.js",
	},
	devServer: {
		static: {
			directory: path.join(__dirname, "public/"),
		},
		port: 3000,
		hot: true,
	},
	plugins: [new webpack.HotModuleReplacementPlugin()],
};
`;

const BABEL = `{
    "presets": [
        "@babel/env",
        "@babel/preset-react"
    ]
}`;

const DEPENDENCIES = [...Object.keys(templateJs.dependencies)];

function init() {
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
			`${chalk.blue("Creating")} a new ${chalk.red(
				"React"
			)} app in ${chalk.green(appName)}.`
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
		const top = root;

		fs.mkdirSync(path.join(top, "/public"));
		console.log(`${chalk.blue("Creating")} ${chalk.red("document")}.`);
		process.chdir("public");
		fs.writeFileSync("./index.html", HTML_BASE);
		console.log(`${chalk.green("Created Document")}.`);

		process.chdir(top);
		fs.mkdirSync(path.join(top, "/src"));
		process.chdir("src");
		console.log(`${chalk.blue("Creating")} ${chalk.red("script files")}.`);
		buildFile("./App", APP_BASE, withTypescript ? "tsx" : "jsx");
		console.log();
		buildFile("./index", INDEX_BASE, withTypescript ? "tsx" : "jsx");

		const packageInstall = new Promise((resolve, reject) => {
			DEPENDENCIES.forEach((dependency) => {
				console.log(chalk.green(`Installing ${dependency}`));
				installPackage(dependency);
			}, resolve());
		});
		packageInstall.then(() => {
			console.log(`${chalk.green("Installed all dependencies")}.`);
		});
		process.chdir(root);
		fs.writeFileSync("./webpack.config.js", webpackConfig(withTypescript));
		console.log(chalk.green("Created webpack.config.js"));
		fs.writeFileSync("./.babelrc", BABEL);
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

	function webpackConfig(withTypescript) {
		const config = `const path = require("path");
const webpack = require("webpack");

module.exports = {
	entry: "./src/index.${withTypescript ? "tsx" : "jsx"}",
	mode: "development",
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				loader: "babel-loader",
				options: { presets: ["@babel/env"] },
			},
			{
				test: /\.(ts|tsx)$/,
				exclude: /node_modules/,
				loader: "ts-loader",
			},
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader"],
			},
		],
	},
	resolve: { extensions: [".css", ".js", ".jsx", ".ts", ".tsx"] },
	output: {
		path: path.resolve(__dirname, "dist/"),
		publicPath: "/dist/",
		filename: "bundle.js",
	},
	devServer: {
		static: {
			directory: path.join(__dirname, "public/"),
		},
		port: 3000,
		hot: true,
	},
	plugins: [new webpack.HotModuleReplacementPlugin()],
};
`;
		return config;
	}

	function installPackage(dependency) {
		const status = execSync("npm install " + dependency, { encoding: "utf-8" });
		console.log(chalk.cyanBright(`Installed ${dependency}`));
	}
}
init();
