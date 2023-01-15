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
    public async post(path: string, body: string): Promise<string> {
        const response = await axios.post(this.constructUrl(path), body);
        return response.data as string;
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

}
