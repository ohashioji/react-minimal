#!/usr/bin/env node
const chalk = require("chalk");
const commander = require("commander");
const fs = require("fs");
const path = require("path");
const os = require("os");

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
	console.log(projectName);
	return createApp(projectName);

	function createApp(name) {
		const root = path.resolve(name);
		const appName = path.basename(root);

		console.log(
			`${chalk.blue("Creating")} a new ${chalk.red(
				"React"
			)} app in ${chalk.green(root)}.`
		);
		const packageJson = {
			name: appName,
			version: "0.1.0",
			private: true,
		};

		fs.appendFileSync(
			"package.json",
			JSON.stringify(packageJson, null, 4) + os.EOL
		);

		const originalDirectory = process.cwd();
		process.chdir(root);
	}
}
init();
