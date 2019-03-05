///<reference path="../Common/Common.ts"/>

import * as tl from "azure-pipelines-task-lib/task";
import * as common from "../Common/Common";

void common.runTfx(async tfx => {
    tfx.arg(["extension", "share"]);

    common.setTfxMarketplaceArguments(tfx);
    common.validateAndSetTfxManifestArguments(tfx);

    // Installation targets
    const accounts = tl.getDelimitedInput("accounts", ",", true);
    tfx.arg(["--share-with"].concat(accounts).map((value, index) => { return value.trim(); }));

    try{
        const code = await tfx.exec();
        tl.setResult(tl.TaskResult.Succeeded, `tfx exited with return code: ${code}`);
    } catch (err)
    {
        tl.setResult(tl.TaskResult.Failed, `tfx failed with error: ${err}`);
    }
});
