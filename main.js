#!/usr/bin/env node
import chalk from "chalk";
import commander from "commander";
import fs from "fs-extra";
import path from "path";
import os from "os";
import tmp from "tmp";

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

		const originalDirectory = process.cwd();
		console.log(
			`${chalk.blue("Creating")} a new ${chalk.red(
				"React"
			)} app in ${chalk.green(appName)}.`
		);
		const packageJson = {
			name: appName,
			version: "0.1.0",
			private: true,
		};
		fs.ensureDirSync(appName);
		process.chdir(appName);
		fs.appendFileSync(
			"package.json",
			JSON.stringify(packageJson, null, 4) + os.EOL
		);

		console.log(originalDirectory);
		return build(appName, originalDirectory, root);
	}

	function build(appName, originalDirectory, root) {
		const top = root;
		console.log(HTML_BASE);
		fs.mkdirSync(path.join(top, "/public"));
		console.log(`${chalk.blue("Creating")} ${chalk.red("document")}.`);
		process.chdir("public");
		fs.writeFileSync("./index.html", HTML_BASE);
		console.log(`${chalk.green("Success!")}.`);

		process.chdir(top);
		fs.mkdirSync(path.join(top, "/src"));
		console.log(`${chalk.blue("Creating")} ${chalk.red("script files")}.`);
		process.chdir("src");
		fs.writeFileSync(
			"./App.tsx",
			`import React from "react";
export default function App() {
    return (
        <div>
            <h1>React Minimal</h1>
        </div>
    );
}`
		);

		console.log(`${chalk.green("Success!")}.`);
	}

	function getTemporaryDirectory() {
		return new Promise((resolve, reject) => {
			// Unsafe cleanup lets us recursively delete the directory if it contains
			// contents; by default it only allows removal if it's empty
			tmp.dir({ unsafeCleanup: true }, (err, tmpdir, callback) => {
				if (err) {
					reject(err);
				} else {
					resolve({
						tmpdir: tmpdir,
						cleanup: () => {
							try {
								callback();
							} catch (ignored) {
								// Callback might throw and fail, since it's a temp directory the
								// OS will clean it up eventually...
							}
						},
					});
				}
			});
		});
	}
}
init();
