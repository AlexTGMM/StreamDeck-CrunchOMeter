import streamDeck from "@elgato/streamdeck";
import { CrunchButton } from "./actions/DisplayButton";

streamDeck.logger.setLevel("trace");

// Only call onDidReceive[Global]Settings when settings change.
streamDeck.settings.useExperimentalMessageIdentifiers = true;

streamDeck.actions.registerAction(new CrunchButton());

streamDeck.connect();
