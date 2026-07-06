export type RuntimeMode = "mock" | "dev" | "prod";

export const runtimeConfig = {
  mode: "dev" as RuntimeMode,
  devBaseURL: "http://127.0.0.1:3000/api/v1",
  prodBaseURL: "https://api.example.com/api/v1",
};

export const getBaseURL = () => {
  if (runtimeConfig.mode === "prod") {
    return runtimeConfig.prodBaseURL;
  }

  return runtimeConfig.devBaseURL;
};

export const isMockMode = () => runtimeConfig.mode === "mock";
