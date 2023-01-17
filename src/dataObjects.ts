export interface ThematicUnit {
    name: string;
    url: string;
    id: string;
    description: string;
    imageLink: string;
}

export interface PractiseLecuture {
    name: string;
    id: string;
    url: string;
}
export interface QuestionInfo {
    id: string;
    code: string;
    correctAnswers: string[];
}

export interface ImageQuestionResource {
    type: "image";
    imageLink: string;
}
export interface VideoQuestionResource {
    type: "video";
    videoLink: string;
    format: string;
}
export interface ImageWithDescriptionQuestionResource {
    type: "imageWithDescription";
    imageLink: string;
    description: string;
}
export type QuestionResource = ImageQuestionResource | VideoQuestionResource | ImageWithDescriptionQuestionResource;
export interface QuestionAnswer {
    marker: string;
    text: string;
    id: string;
}
export interface Question {
    texts: string[];
    resources: QuestionResource[];
    answers: QuestionAnswer[];
}

export interface QuestionWithCorrectAnswer extends Question {
    correctAnswers: string[];
}
