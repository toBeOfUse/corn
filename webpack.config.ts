import HtmlWebpackPlugin from "html-webpack-plugin";
import path from "path";
export default {
  mode: "development",
  entry: "./src/index.ts",
  output: {
    path: path.join(__dirname, "dist"),
    filename: "index_bundle.[contenthash].js",
  },
  plugins: [new HtmlWebpackPlugin({ template: "./src/index.html" })],
};
