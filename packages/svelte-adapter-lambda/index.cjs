const { join } = require("path");
const rollup = require("rollup");
const { nodeResolve } = require("@rollup/plugin-node-resolve");

/**
 * @param {{
 *   out?: string;
 * }} options
 */
module.exports = function ({ out = "build" } = {}) {
  /** @type {import('@sveltejs/kit').Adapter} */
  const adapter = {
    name: "svelte-lambda-adapter",

    async adapt(utils) {
      utils.log.minor("Clearing build directory");
      utils.rimraf(out);

      utils.log.minor("Copying assets");
      const static_directory = join(out, "static");
      utils.copy_client_files(static_directory);
      utils.copy_static_files(static_directory);

      utils.log.minor("Copying server");
      const server_directory = join(out, "server");
      utils.copy_server_files(server_directory);

      // Svelte only really likes to produce es modules,
      // but lambda only supports commonjs... So, compile
      // the generated esm app to cjs
      const rollupBuild = await rollup.rollup({
        input: join(server_directory, "app.js"),
        external: [...require("module").builtinModules],
        plugins: [nodeResolve()],
      });
      await rollupBuild.write({
        file: join(server_directory, "app.cjs"),
        format: "cjs",
      });

      utils.copy(
        join(__dirname, "files", "lambda.cjs"),
        join(server_directory, "index.js")
      );

      utils.log.minor("Prerendering static pages");
      await utils.prerender({
        dest: static_directory,
      });
    },
  };

  return adapter;
};
