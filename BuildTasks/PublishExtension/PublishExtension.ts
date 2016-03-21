///<reference path="../typings/main.d.ts" />
import tl = require("vsts-task-lib/task");
import common = require("./common");

common.runTfx(tfx => {
    tfx.arg(["extension", "publish", "--json"]);
    const outputVariable = tl.getInput("outputVariable", false);

    // Read gallery endpoint
    const galleryEndpoint = common.getMarketplaceEndpointDetails();
    tfx.arg(["--token", galleryEndpoint.token]);
    tfx.arg(["--service-url", galleryEndpoint.url]);

    // Read file type
    const fileType = tl.getInput("fileType", true);
    let cleanupTfxArgs: () => void;
    if (fileType === "manifest") {
        // Set tfx manifest arguments
        cleanupTfxArgs = common.setTfxManifestArguments(tfx);
    } else {
        // Set vsix file argument
        let vsixFile = tl.getInput("vsixFile", true);
        tfx.arg(["--vsix", vsixFile]);
    }

    // Share with
    const shareWith = tl.getInput("shareWith");
    if (shareWith) {
        // Sanitize accounts to share with
        let accounts = shareWith.split(",").map(a => a.replace(/\s/g, "")).filter(a => a.length > 0);
        tfx.argIf(accounts && accounts.length > 0, ["--share-with", ...accounts]);
    }

    // Aditional arguments
    tfx.arg(tl.getInput("arguments", false));

    // Set working folder
    const cwd = tl.getInput("cwd", false);
    if (cwd) {
        tl.cd(cwd);
    }

    const outputStream = new common.TfxJsonOutputStream();

    tfx.exec(<any>{ outStream: outputStream, failOnStdErr: true }).then(code => {
        const json = JSON.parse(outputStream.jsonString);

        const publishedVsix = fileType === "manifest" ? json.packaged : tl.getInput("vsixFile");

        if (fileType === "manifest" && outputVariable) {
            tl.setVariable(outputVariable, publishedVsix);
        }

        tl._writeLine(`Published VSIX: ${publishedVsix}.`);
        tl.setResult(tl.TaskResult.Succeeded, `tfx exited with return code: ${code}`);
    }).fail(err => {
        tl.setResult(tl.TaskResult.Failed, `tfx failed with error: ${err}`);
    }).finally(() => {
        if (cleanupTfxArgs) {
            cleanupTfxArgs();
        }
    });
});
