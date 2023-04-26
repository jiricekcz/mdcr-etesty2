import {
    ThematicUnit,
    PractiseLecuture,
    QuestionInfo,
    Question,
    QuestionResource,
    QuestionAnswer,
} from "./dataObjects";
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
    getPractiseLecutures(thematicUnitId: string): Promise<PractiseLecuture[]>;

    /**
     * Fetches question info for a practise lecture.
     * @param lectureId The id of the lecture
     */
    getPractiseLectureQuestionsInfo(lectureId: string): Promise<QuestionInfo[]>;

    /**
     * Fetches the full question
     * @param questionId The id of the question
     */
    getQuestion(questionId: string): Promise<Question>;
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
            if (url && typeof url !== "string") {
                if (this.options.warnOnNonFatalParseErrors)
                    console.warn(
                        `Parse Error - getThematicUnits: URL is not a string, but ${typeof url}. This is a non-fatal error. This thematic unit will be skipped. Set 'warnOnNonFatalParseErrors' to 'false' to disable this warning.`
                    );
                if (this.options.errorOnNonFatalParseErrors)
                    throw new Error(
                        `Parse Error - getThematicUnits: RL is not a string, but ${typeof url}. This is a non-fatal error. This thematic unit can be skipped if 'errorOnNonFatalParseErrors' is set to 'false'`
                    );
                continue;
            }
            console.log(url);
            const id = url ? url?.split("/")[url?.split("/").length - 1] : undefined; // The id is the last item in the url
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

    async getPractiseLecutures(thematicUnitId: string): Promise<PractiseLecuture[]> {
        const html = await this.fetcher.getThematicUnitPage(thematicUnitId); // fetches raw html
        const root = hp.parse(html);

        const vertialMenuPanel = root.querySelector("#VerticalMenuPanel"); // Each practise question unit has a button in the vertical menu panel
        if (vertialMenuPanel === null) {
            throw new Error(
                "Parse Error - getPractiseLecutures: Unable to find vertical menu panel. The page may have changed. Please try updating the scraper. If the problem persists, please open a GitHub issue."
            );
        }

        const practiseLecuturesLinks = vertialMenuPanel
            .querySelectorAll("a")
            .filter((a) => a.getAttribute("href")?.startsWith("/Test/TestPractise/")); // selects all links in the vertical menu panel and filters out the ones that are not practise question units

        const practiseLecutures: PractiseLecuture[] = [];

        for (const link of practiseLecuturesLinks) {
            const url = link.getAttribute("href")?.replace("/", ""); // The url is in the href attribute
            const id = url?.split("/").[url?.split("/").length - 1]; // The id is the last item in the url
            const title = link.structuredText; // The title is the text of the link

            if (url === undefined || id === undefined || title === undefined) {
                if (this.options.warnOnNonFatalParseErrors)
                    console.warn(
                        "Parse Error - getPractiseLecutures: Unable to parse practise lecture. This is a non-fatal error. This practise lecture will be skipped. Set 'warnOnNonFatalParseErrors' to 'false' to disable this warning."
                    );
                if (this.options.errorOnNonFatalParseErrors)
                    throw new Error(
                        "Parse Error - getPractiseLecutures: Unable to parse practise lecture. This is a non-fatal error. This practise lecture can be skipped if 'errorOnNonFatalParseErrors' is set to 'false'"
                    );
                continue;
            }

            practiseLecutures.push({
                url,
                id,
                name: title,
            });
        }

        return practiseLecutures;
    }

    async getPractiseLectureQuestionsInfo(practiseLecutureId: string): Promise<QuestionInfo[]> {
        const json = await this.fetcher.getSamplePractiseLectureTest(practiseLecutureId); // fetches raw json
        const rawQuestions = json?.Questions as
            | { QuestionID: number; Code: string; CorrectAnswers: string[] }[]
            | undefined; // The questions are in the Questions array

        if (rawQuestions === undefined) {
            throw new Error(
                "Parse Error - getPractiseLecutureQuestions: Unable to parse practise lecture questions. The page may have changed. Please try updating the scraper. If the problem persists, please open a GitHub issue."
            );
        }

        return rawQuestions
            .sort((a, b) => a.QuestionID - b.QuestionID)
            .map((rawQuestion) => {
                return {
                    id: rawQuestion.QuestionID.toString(),
                    code: rawQuestion.Code,
                    correctAnswers: rawQuestion.CorrectAnswers.map(String),
                };
            });
    }

    public async getQuestion(questionId: string): Promise<Question> {
        const html = await this.fetcher.getQuestion(questionId); // fetches raw html
        const root = hp.parse(html);

        const questionTexts = root.querySelectorAll(".question-text"); // The question text is in the questionText class

        const texts: string[] = [];
        for (const questionText of questionTexts) {
            if (questionText.tagName.toLocaleLowerCase() === "p") {
                texts.push(questionText.structuredText);
                continue;
            }

            if (this.options.warnOnNonFatalParseErrors) {
                console.warn(
                    "Parse Error - getQuestion: Unable to parse question text. This is a non-fatal error. This question text will be skipped. Set 'warnOnNonFatalParseErrors' to 'false' to disable this warning."
                );
            }
            if (this.options.errorOnNonFatalParseErrors) {
                throw new Error(
                    "Parse Error - getQuestion: Unable to parse question text. This is a non-fatal error. This question text can be skipped if 'errorOnNonFatalParseErrors' is set to 'false'"
                );
            }
        }

        const imageFrame = root.querySelector(".image-frame"); // The image is in the imageFrame class
        const resourcesHTML = imageFrame?.childNodes;

        if (imageFrame === undefined) {
            throw new Error(
                "Parse Error - getQuestion: Unable to parse question content frame. The page may have changed. Please try updating the scraper. If the problem persists, please open a GitHub issue. Question ID: " +
                    questionId
            );
        }
        if (resourcesHTML === undefined) {
            throw new Error(
                "Parse Error - getQuestion: Unable to parse question content. The page may have changed. Please try updating the scraper. If the problem persists, please open a GitHub issue. Question ID: " +
                    questionId
            );
        }
        const isHTMLElement = (node: typeof resourcesHTML[number]): node is typeof root =>
            node.nodeType === hp.NodeType.ELEMENT_NODE;
        const resources: QuestionResource[] = [];
        for (const resourceHTML of resourcesHTML) {
            if (!isHTMLElement(resourceHTML)) continue;

            if (resourceHTML.classNames.includes("question-text")) continue;

            if (resourceHTML.tagName.toLocaleLowerCase() === "img") {
                const src = resourceHTML.getAttribute("src");
                if (src === undefined) {
                    if (this.options.warnOnNonFatalParseErrors) {
                        console.warn(
                            "Parse Error - getQuestion: Unable to parse question resource. This is a non-fatal error. This question resource will be skipped. Set 'warnOnNonFatalParseErrors' to 'false' to disable this warning."
                        );
                    }
                    if (this.options.errorOnNonFatalParseErrors) {
                        throw new Error(
                            "Parse Error - getQuestion: Unable to parse question resource. This is a non-fatal error. This question resource can be skipped if 'errorOnNonFatalParseErrors' is set to 'false'"
                        );
                    }
                    continue;
                }
                resources.push({
                    type: "image",
                    imageLink: src,
                });
                continue;
            }

            if (resourceHTML.tagName.toLocaleLowerCase() === "video") {
                const source = resourceHTML.querySelector("source");
                if (source === null) {
                    if (this.options.warnOnNonFatalParseErrors) {
                        console.warn(
                            "Parse Error - getQuestion: Unable to parse question resource. This is a non-fatal error. This question resource will be skipped. Set 'warnOnNonFatalParseErrors' to 'false' to disable this warning."
                        );
                    }
                    if (this.options.errorOnNonFatalParseErrors) {
                        throw new Error(
                            "Parse Error - getQuestion: Unable to parse question resource. This is a non-fatal error. This question resource can be skipped if 'errorOnNonFatalParseErrors' is set to 'false'"
                        );
                    }
                    continue;
                }

                const src = source.getAttribute("src");
                const type = source.getAttribute("type");

                if (src === undefined || type === undefined) {
                    if (this.options.warnOnNonFatalParseErrors) {
                        console.warn(
                            "Parse Error - getQuestion: Unable to parse question resource. This is a non-fatal error. This question resource will be skipped. Set 'warnOnNonFatalParseErrors' to 'false' to disable this warning."
                        );
                    }
                    if (this.options.errorOnNonFatalParseErrors) {
                        throw new Error(
                            "Parse Error - getQuestion: Unable to parse question resource. This is a non-fatal error. This question resource can be skipped if 'errorOnNonFatalParseErrors' is set to 'false'"
                        );
                    }
                    continue;
                }

                resources.push({
                    type: "video",
                    videoLink: src,
                    format: type,
                });
                continue;
            }

            if (resourceHTML.tagName.toLocaleLowerCase() === "div") {
                const elementNodes = resourceHTML.childNodes.filter(isHTMLElement);
                if (
                    elementNodes.length == 2 &&
                    elementNodes[0]?.tagName.toLocaleLowerCase() === "img" &&
                    elementNodes[1]?.tagName.toLocaleLowerCase() === "a"
                ) {
                    const src = elementNodes[0].getAttribute("src");
                    const content = elementNodes[1].structuredText;

                    if (src === undefined || content === undefined) {
                        if (this.options.warnOnNonFatalParseErrors) {
                            console.warn(
                                "Parse Error - getQuestion: Unable to parse question resource. This is a non-fatal error. This question resource will be skipped. Set 'warnOnNonFatalParseErrors' to 'false' to disable this warning."
                            );
                        }
                        if (this.options.errorOnNonFatalParseErrors) {
                            throw new Error(
                                "Parse Error - getQuestion: Unable to parse question resource. This is a non-fatal error. This question resource can be skipped if 'errorOnNonFatalParseErrors' is set to 'false'"
                            );
                        }
                        continue;
                    }

                    resources.push({
                        type: "imageWithDescription",
                        imageLink: src,
                        description: content,
                    });
                    continue;
                }
            }
            if (this.options.warnOnNonFatalParseErrors) {
                console.warn(
                    "Parse Error - getQuestion: Unknown question resource format. This is a non-fatal error. This question resource will be skipped. Set 'warnOnNonFatalParseErrors' to 'false' to disable this warning."
                );
            }
            if (this.options.errorOnNonFatalParseErrors) {
                throw new Error(
                    "Parse Error - getQuestion: Unknown question resource format. This is a non-fatal error. This question resource can be skipped if 'errorOnNonFatalParseErrors' is set to 'false'"
                );
            }
        }

        // Answers

        const answersHTML = root.querySelectorAll(".answer");

        const answers: QuestionAnswer[] = [];
        for (const answerHTML of answersHTML) {
            const answerId = answerHTML.getAttribute("data-answerid");
            if (answerId === undefined)
                throw new Error(
                    "Parse Error - getQuestion: Unable to parse answer ID. The page may have changed. Please try updating the scraper. If the problem persists, please open a GitHub issue. Question ID: " +
                        questionId
                );

            const answerCheckbox = answerHTML.querySelector(".answer-checkbox");
            if (answerCheckbox === null)
                throw new Error(
                    "Parse Error - getQuestion: Unable to parse answer checkbox. The page may have changed. Please try updating the scraper. If the problem persists, please open a GitHub issue. Question ID: " +
                        questionId
                );

            const textParagraph = answerHTML.querySelector("p");
            if (textParagraph === null)
                throw new Error(
                    "Parse Error - getQuestion: Unable to parse answer text. The page may have changed. Please try updating the scraper. If the problem persists, please open a GitHub issue. Question ID: " +
                        questionId
                );
            answers.push({
                id: answerId,
                marker: answerCheckbox.structuredText.trim(),
                text: textParagraph.structuredText.trim(),
            });
        }

        return {
            answers: answers,
            resources: resources,
            texts: texts.map((text) => text.trim()).filter((text) => text.length > 0),
        };
    }
}
