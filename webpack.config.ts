import HtmlWebpackPlugin from "html-webpack-plugin";
import path from "path";
export default (_, options) => ({
  mode: options.mode || "development",
  entry: "./src/index.ts",
  output: {
    path: path.join(__dirname, "dist"),
    filename: "index_bundle.[contenthash].js",
  },
  devtool:
    !options.mode || options.mode == "development" ? "eval-source-map" : false,
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [{ test: /\.tsx?$/, loader: "ts-loader" }],
  },
  plugins: [new HtmlWebpackPlugin({ template: "./src/index.html" })],
});
