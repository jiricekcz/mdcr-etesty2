import axios from "axios";

/**
 * Fetches the raw data from the source. Because this is a scraper, the raw data can be large, include useless data, and be in a format that is not easy to work with.
 */
export interface Fetcher {
    readonly url: string;

    /**
     * Fetches /Home
     */
    getHomePage(): Promise<string>;

    /**
     * Fetches the page for a thematic unit.
     * @param id The id of the thematic unit
     */
    getThematicUnitPage(id: string): Promise<string>;

    /**
     * Fetches json data for a practise lecture.
     * @param lectureId The id of the lecture
     */
    getSamplePractiseLectureTest(
        lectureId: string
    ): Promise<{ Questions: { QuestionID: number; Code: string; CorrectAnswers: string[] }[] }>;

    /**
     * Fetches the html for a question.
     * @param questionId The id of the question
     */
    getQuestion(questionId: string): Promise<string>;
}

export class AxiosFetcher implements Fetcher {
    constructor(public readonly url: string) {}

    private constructUrl(path: string): string {
        return `${this.url}/${path}`;
    }
    /**
     * Fetches data from the source using a GET request.
     * @returns The raw data from the source.
     */
    public async get(path: string): Promise<string> {
        const response = await axios.get(this.constructUrl(path));
        return response.data as string;
    }

    /**
     * Fetches data from the source usting a POST request.
     * @param path Path to post to
     * @param body The body of the post request
     * @returns The raw data from the source.
     */
    public async post<T>(path: string, body: string): Promise<T> {
        const response = await axios.post(this.constructUrl(path), body);
        return response.data as T;
    }

    /**
     * Fetches the html of the home page.
     * @returns The HTML of the home page.
     */
    public async getHomePage(): Promise<string> {
        return await this.get("Home");
    }

    /**
     * Fetches the html of the thematic unit page.
     * @param id The id of the thematic unit
     * @returns The HTML of the thematic unit page.
     */
    public async getThematicUnitPage(id: string): Promise<string> {
        return await this.get(`Home/Tests/${id}`);
    }

    /**
     * Fetches JSON of a practise lecture test.
     * @param lectureId Id of the lecture
     * @returns Raw JSON data
     */
    public async getSamplePractiseLectureTest(
        lectureId: string
    ): Promise<{ Questions: { QuestionID: number; Code: string; CorrectAnswers: string[] }[] }> {
        return await this.post(`Test/GeneratePractise/`, `lectureID=${lectureId}`);
    }

    /**
     * Fetches the HTML of a question.
     * @param questionId The id of the question
     * @returns Raw HTML data
     */
    public async getQuestion(questionId: string): Promise<string> {
        return await this.post(`Test/RenderQuestion/`, `id=${questionId}`);
    }
}
