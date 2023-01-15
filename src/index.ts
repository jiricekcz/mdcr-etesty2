import { AxiosFetcher } from "./fetcher";
import { HTMLParserDataProcessor } from "./dataProcessor";

const fetcher = new AxiosFetcher("https://etesty2.mdcr.cz");
const processor = new HTMLParserDataProcessor(fetcher);

processor.getThematicUnits().then(console.log);