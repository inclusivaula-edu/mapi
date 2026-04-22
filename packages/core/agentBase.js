export class Agent {
  constructor(name) {
    this.name = name;
  }

  async execute(input) {
    throw new Error("execute() não implementado");
  }
}