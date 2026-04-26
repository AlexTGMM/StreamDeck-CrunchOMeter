import { config } from "@elgato/eslint-config";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
	globalIgnores(["com.alexnickels.crunchometer.sdPlugin/bin/**"]),
	{
		extends: [config.recommended],
		// Anything from here will override @elgato/eslint-config
		rules: {
			"jsdoc/require-jsdoc": "off", // yeah... not doing this for a small side project
			// TODO: figure out how to configure this into an "order groups, but not within groups" style
			"@typescript-eslint/member-ordering": "off",
		},
	},
]);
