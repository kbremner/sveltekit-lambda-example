const preprocess = require('svelte-preprocess');
const lambda = require('svelte-adapter-lambda');

/** @type {import('@sveltejs/kit').Config} */
module.exports = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(),

	kit: {
		adapter: lambda(),
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte'
	}
};
