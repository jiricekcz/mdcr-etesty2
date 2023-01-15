import { ThematicUnit, PractiseQuestionUnit } from "./dataObjects";
import { Fetcher } from "./fetcher";
import hp from "node-html-parser";
/**
 * Processes data provided by the Fetcher. This is where the data is cleaned up and converted into a format that is easy to work with.
 * Usually designed to perform a single request
 */
export interface DataProcessor {
    readonly fetcher: Fetcher;

    /**
     * Fetches the thematic units from the source.
     */
    getThematicUnits(): Promise<ThematicUnit[]>;

    /**
     * Fetches the practise question units from the source.
     */
    getPractiseQuestionUnits(thematicUnitId: string): Promise<PractiseQuestionUnit[]>;
}

export interface DataProcessorOptions {
    warnOnNonFatalParseErrors: boolean;
    errorOnNonFatalParseErrors: boolean;
}
export const defaultDataProcessorOptions: DataProcessorOptions = {
    warnOnNonFatalParseErrors: true,
    errorOnNonFatalParseErrors: false,
};
export class HTMLParserDataProcessor implements DataProcessor {
    constructor(
        public readonly fetcher: Fetcher,
        protected options: DataProcessorOptions = defaultDataProcessorOptions
    ) {}

    async getThematicUnits(): Promise<ThematicUnit[]> {
        const html = await this.fetcher.getHomePage(); // fetches raw html
        const root = hp.parse(html);

        const buttonPanel = root.querySelector(".ButtonPanel"); // Each thematic unit has a button in the button panel
        if (buttonPanel === null) {
            throw new Error(
                "Parse Error - getThematicUnits: Unable to find button panel. The page may have changed. Please try updating the scraper. If the problem persists, please open a GitHub issue."
            );
        }
        const thematicUnitButtons = buttonPanel.querySelectorAll(".Button"); // Each button has a link to the thematic unit

        const thematicUnits: ThematicUnit[] = [];
        for (const button of thematicUnitButtons) {
            const title = button.querySelector(".Title"); // Each button has a title
            const onClick = button.getAttribute("onclick"); // The url is hidden in the onclick attribute
            const text = button.querySelector(".Text"); // Description is in the text element
            const image = button.querySelector(".Image")?.querySelector("img"); // The image is in the image element
            if (title === null || onClick === undefined || text === null || image == null) {
                if (this.options.warnOnNonFatalParseErrors)
                    console.warn(
                        "Parse Error - getThematicUnits: Unable to parse thematic unit. This is a non-fatal error. This thematic unit will be skipped. Set 'warnOnNonFatalParseErrors' to 'false' to disable this warning."
                    );
                if (this.options.errorOnNonFatalParseErrors)
                    throw new Error(
                        "Parse Error - getThematicUnits: Unable to parse thematic unit. This is a non-fatal error. This thematic unit can be skipped if 'errorOnNonFatalParseErrors' is set to 'false'"
                    );
                continue;
            }

            const url = onClick.split("'")[1]?.replace("/", ""); // The url is the second item in the onclick attribute
            const id = url?.split("/").at(-1); // The id is the last item in the url
            if (url === undefined || id === undefined) {
                if (this.options.warnOnNonFatalParseErrors)
                    console.warn(
                        "Parse Error - getThematicUnits: Unable to parse thematic unit URL. This is a non-fatal error. This thematic unit will be skipped. Set 'warnOnNonFatalParseErrors' to 'false' to disable this warning."
                    );
                if (this.options.errorOnNonFatalParseErrors)
                    throw new Error(
                        "Parse Error - getThematicUnits: Unable to parse thematic unit URL. This is a non-fatal error. This thematic unit can be skipped if 'errorOnNonFatalParseErrors' is set to 'false'"
                    );
                continue;
            }

            const imageLink = image.getAttribute("src")?.replace("/", ""); // The image link is in the src attribute
            if (imageLink === undefined) {
                if (this.options.warnOnNonFatalParseErrors)
                    console.warn(
                        "Parse Error - getThematicUnits: Unable to parse thematic unit image. This is a non-fatal error. This thematic unit will be skipped. Set 'warnOnNonFatalParseErrors' to 'false' to disable this warning."
                    );
                if (this.options.errorOnNonFatalParseErrors)
                    throw new Error(
                        "Parse Error - getThematicUnits: Unable to parse thematic unit image. This is a non-fatal error. This thematic unit can be skipped if 'errorOnNonFatalParseErrors' is set to 'false'"
                    );
                continue;
            }
            thematicUnits.push({
                name: title.structuredText,
                url,
                id,
                description: text.structuredText,
                imageLink,
            });
        }
        return thematicUnits;
    }

    async getPractiseQuestionUnits(thematicUnitId: string): Promise<PractiseQuestionUnit[]> {
        const html = await this.fetcher.getThematicUnitPage(thematicUnitId); // fetches raw html
        const root = hp.parse(html);

        const vertialMenuPanel = root.querySelector("#VerticalMenuPanel"); // Each practise question unit has a button in the vertical menu panel
        if (vertialMenuPanel === null) {
            throw new Error(
                "Parse Error - getPractiseQuestionUnits: Unable to find vertical menu panel. The page may have changed. Please try updating the scraper. If the problem persists, please open a GitHub issue."
            );
        }

        const practiseQuestionUnitsLinks = vertialMenuPanel
            .querySelectorAll("a")
            .filter((a) => a.getAttribute("href")?.startsWith("/Test/TestPractise/")); // selects all links in the vertical menu panel and filters out the ones that are not practise question units

        const practiseQuestionUnits: PractiseQuestionUnit[] = [];

        for (const link of practiseQuestionUnitsLinks) {
            const url = link.getAttribute("href")?.replace("/", ""); // The url is in the href attribute
            const id = url?.split("/").at(-1); // The id is the last item in the url
            const title = link.structuredText; // The title is the text of the link

            if (url === undefined || id === undefined || title === undefined) {
                if (this.options.warnOnNonFatalParseErrors)
                    console.warn(
                        "Parse Error - getPractiseQuestionUnits: Unable to parse practise question unit. This is a non-fatal error. This practise question unit will be skipped. Set 'warnOnNonFatalParseErrors' to 'false' to disable this warning."
                    );
                if (this.options.errorOnNonFatalParseErrors)
                    throw new Error(
                        "Parse Error - getPractiseQuestionUnits: Unable to parse practise question unit. This is a non-fatal error. This practise question unit can be skipped if 'errorOnNonFatalParseErrors' is set to 'false'"
                    );
                continue;
            }

            practiseQuestionUnits.push({
                url,
                id,
                name: title,
            });
        }

        return practiseQuestionUnits;
    }
}
