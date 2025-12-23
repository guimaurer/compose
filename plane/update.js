import utils from "../utils.js";
import fs from "fs";

await utils.cloneOrPullRepo({
  repo: "https://github.com/makeplane/plane.git",
  path: "./repo",
  branch: "v1.2.1",
});

// Check which directory structure exists (v1.2.1 may have changed structure)
const selfhostPath = "./repo/deploy/selfhost";
const communityPath = "./repo/deployments/cli/community";

let sourcePath;
if (fs.existsSync(selfhostPath)) {
  sourcePath = selfhostPath;
} else if (fs.existsSync(communityPath)) {
  sourcePath = communityPath;
} else {
  throw new Error(`Neither ${selfhostPath} nor ${communityPath} found in repository`);
}

await utils.copyDir(sourcePath, "./code");

// Check which variables file exists and rename it
const variablesEnvPath = "./code/variables.env";
const planeEnvPath = "./code/plane.env";
const envExamplePath = "./code/.env.example";

if (fs.existsSync(variablesEnvPath)) {
  await utils.renameFile(variablesEnvPath, envExamplePath);
} else if (fs.existsSync(planeEnvPath)) {
  await utils.renameFile(planeEnvPath, envExamplePath);
}

await utils.removeContainerNames("./code/docker-compose.yml");
await utils.removePorts("./code/docker-compose.yml");
