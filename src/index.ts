import { AxiosFetcher } from "./fetcher";
import { HTMLParserDataProcessor } from "./dataProcessor";
import { QuestionInfo, QuestionWithCorrectAnswer } from "./dataObjects";
import { promises as fs } from "fs";

const fetcher = new AxiosFetcher("https://etesty2.mdcr.cz");
const processor = new HTMLParserDataProcessor(fetcher);

// processor.getThematicUnits().then(console.log);
// processor.getPractiseLecutures("ro").then(console.log);
// processor.getPractiseLectureQuestionsInfo("24").then(console.log);
// processor.getQuestion("2209").then(console.log);

async function main(): Promise<void> {
    const thematicUnits = await processor.getThematicUnits();
    const questions: QuestionWithCorrectAnswer[] = [];
    console.log(`------------------\n${thematicUnits.length} thematic units found\n------------------`);
    for (const thematicUnit of thematicUnits) {
        console.log(`\t${thematicUnit.name}`);
        const practiseLectures = await processor.getPractiseLecutures(thematicUnit.id);
        console.log(`\t\t${practiseLectures.length} practise lectures found`);
        for (const practiseLecture of practiseLectures) {
            console.log(`\t\t\t${practiseLecture.name}`);
            const questionsInfo = await processor.getPractiseLectureQuestionsInfo(practiseLecture.id);
            console.log(`\t\t\t\t${questionsInfo.length} questions found`);
            for (let i = 0; i < questionsInfo.length; i++) {
                const questionInfo = questionsInfo[i] as QuestionInfo;
                const question = await processor.getQuestion(questionInfo.id);
                questions.push({
                    correctAnswers: questionInfo.correctAnswers,
                    ...question,
                });
                process.stdout.clearLine(0);
                process.stdout.cursorTo(0);
                process.stdout.write(
                    `\t\t\t\tProcessed ${i + 1}/${questionsInfo.length} questions. Working on ${questionInfo.code}...`
                );
            }
            console.log(); // New line
        }
    }
    console.log(`Processed ${questions.length} questions in total.`);
    await fs.writeFile("./output.json", JSON.stringify(questions, null, 4));
}

main().then(() => console.log("Done!"));
