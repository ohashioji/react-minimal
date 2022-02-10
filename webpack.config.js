const path = require("path");
const webpack = require("webpack");

module.exports = {
	entry: "./src/index.tsx",
	mode: "development",
	module: {
		rules: [
			{
				test: /\.(js|jsx|ts|tsx)$/,
				exclude: /(node_modules|bower_components)/,
				loader: "babel-loader",
				options: { presets: ["@babel/env"] },
			},
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader"],
			},
		],
	},
	resolve: { extensions: ["*", ".js", ".jsx", ".ts", ".tsx"] },
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
		historyApiFallback: true,
		liveReload: true,
	},
	plugins: [new webpack.HotModuleReplacementPlugin()],
};
