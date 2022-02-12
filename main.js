#!/usr/bin/env node
import chalk from "chalk";
import commander from "commander";
import fs from "fs-extra";
import path, { resolve } from "path";
import os from "os";
import tmp from "tmp";
import spawn from "cross-spawn";
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
		.parse(process.argv);

	return createApp(projectName);

	function createApp(name) {
		const root = path.resolve(name);
		const appName = path.basename(root);

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

		return buildFiles(root);
	}

	function buildFile(path, content, root, message, file) {
		fs.mkdirSync(path.join(root, path));
		console.log(`${chalk.blue("Creating")} ${chalk.red(message)}.`);
		process.chdir(root);
		fs.writeFileSync(file, content);
		console.log(`${chalk.green(`Created ${file}`)}.`);
	}

	function buildFiles(root) {
		const top = root;
		
		fs.mkdirSync(path.join(top, "/public"));
		console.log(`${chalk.blue("Creating")} ${chalk.red("document")}.`);
		process.chdir("public");
		fs.writeFileSync("./index.html", HTML_BASE);
		console.log(`${chalk.green("Created Document")}.`);

		process.chdir(top);
		fs.mkdirSync(path.join(top, "/src"));
		console.log(`${chalk.blue("Creating")} ${chalk.red("script files")}.`);
		process.chdir("src");
		fs.writeFileSync("./App.tsx", APP_BASE);

		console.log(`${chalk.green("Created App.tsx in /src")}.`);
		console.log();
		fs.writeFileSync("./index.tsx", INDEX_BASE);
		console.log(`${chalk.green("Created index.tsx in /src")}.`);

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
		fs.writeFileSync("./webpack.config.js", WEBPACK);
		console.log(chalk.green("Created webpack.config.js"));
		fs.writeFileSync("./.babelrc", BABEL);
		console.log(chalk.green("Created .babelrc"));
		genTsConfig();
		console.log(chalk.green("Created tsconfig.json"));
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

	function installPackage(dependency) {
		const status = execSync("npm install " + dependency, { encoding: "utf-8" });
		console.log(chalk.cyanBright(`Installed ${dependency}`));
	}
}
init();
