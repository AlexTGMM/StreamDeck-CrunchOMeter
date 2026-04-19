import streamDeck from "@elgato/streamdeck";

import { DisplayButton } from "./actions/displaybutton";

streamDeck.logger.setLevel("trace");

streamDeck.actions.registerAction(new DisplayButton());

streamDeck.connect();
