import { execa } from "execa";
import fs from "fs";
import yaml from "yaml";

async function cloneOrPullRepo({
  repo,
  path = "./repo",
  branch = "main",
  depth = 1,
}) {
  // Detect if branch is actually a tag (starts with "v")
  const isTag = branch.startsWith("v");
  
  if (!fs.existsSync(path)) {
    console.log(`Cloning ${repo} into ${path} (${isTag ? "tag" : "branch"}: ${branch})`);
    if (isTag) {
      // For tags, clone the repo first, then checkout the tag
      // We need to fetch tags, so we clone with a bit more depth or fetch tags after
      await execa(
        "git",
        [
          "clone",
          ["--depth", Math.max(depth, 10).toString()], // Need more depth for tags
          repo,
          path,
        ].flat()
      );
      // Fetch tags and checkout the specific tag
      await execa("git", ["fetch", "origin", "--tags"], { cwd: path });
      await execa("git", ["checkout", branch], { cwd: path });
    } else {
      // For branches, use --single-branch
      await execa(
        "git",
        [
          "clone",
          ["--depth", depth],
          ["--branch", branch],
          "--single-branch",
          repo,
          path,
        ].flat()
      );
    }
  } else {
    if (isTag) {
      console.log(`Fetching tags and checking out ${branch} in ${path}`);
      await execa("git", ["fetch", "origin", "--tags"], { cwd: path });
      await execa("git", ["checkout", branch], { cwd: path });
    } else {
      console.log(`Pulling ${repo} into ${path}`);
      await execa("git", ["pull", "origin", branch], { cwd: path });
    }
  }
}

async function removeContainerNames(path) {
  console.log(`Removing container names from ${path}`);

  const file = await fs.promises.readFile(path, "utf8");
  const document = yaml.parseDocument(file);

  document.get("services").items.forEach((item) => {
    item.value.delete("container_name");
  });

  await fs.promises.writeFile(path, document.toString());
}

async function removePorts(path) {
  console.log(`Removing ports from ${path}`);

  const file = await fs.promises.readFile(path, "utf8");
  const document = yaml.parseDocument(file);

  document.get("services").items.forEach((item) => {
    item.value.delete("ports");
  });

  await fs.promises.writeFile(path, document.toString());
}

async function copyDir(src, dest) {
  console.log(`Copying ${src} to ${dest}`);

  await execa("rm", ["-rf", dest]);
  await execa("cp", ["-r", src, dest]);
}

async function downloadFile(url, dest) {
  console.log(`Downloading ${url} to ${dest}`);

  await execa("curl", ["-s", url, "-o", dest]);
}

async function renameFile(src, dest) {
  console.log(`Renaming ${src} to ${dest}`);

  await execa("mv", [src, dest]);
}

async function searchReplace(path, search, replace) {
  console.log(`Searching and replacing ${search} with ${replace} in ${path}`);

  const file = await fs.promises.readFile(path, "utf8");
  const newFile = file.replaceAll(search, replace);

  await fs.promises.writeFile(path, newFile);
}

export default {
  cloneOrPullRepo,
  removeContainerNames,
  removePorts,
  copyDir,
  downloadFile,
  renameFile,
  searchReplace,
};
