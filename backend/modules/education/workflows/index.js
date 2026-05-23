import generateLesson from "./workflows/generateLesson.js";

export default {
  name: "education",
  workflows: {
    "gerar-aula": generateLesson
  }
};