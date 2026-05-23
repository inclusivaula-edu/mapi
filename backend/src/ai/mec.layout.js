export function buildMECHeader(student) {
  return {
    institution: {
      name: "SECRETARIA MUNICIPAL DE EDUCAÇÃO",
      department: "ATENDIMENTO EDUCACIONAL ESPECIALIZADO (AEE)",
      city: "SEU MUNICIPIO",
      state: "SEU ESTADO",
    },
    student: {
      name: student.name,
      age: student.age,
      grade: student.grade,
      diagnosis: student.diagnosis || "Não informado",
    },
    generatedAt: new Date(),
  };
}