import * as fs from "fs";
import * as yargs from "yargs";
import * as jsforce from "jsforce";
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname+'/.env' });

// accept command line arguments
let { argv } = <any>{};
argv = yargs
  .option("mode", {
    description: "required. You have to specify running mode 'on' or 'off'",
    demandOption: false,
    default: "off"
  })
  .help().argv;

const DEFINITION_DATA_FILE_PATH = __dirname + '/data/' + process.env.SF_USERNAME + '_define.json';

(async () => {
  const conn = new jsforce.Connection({
    loginUrl : 'https://' + process.env.DOMAIN + '.salesforce.com'
  });
  await conn.login(process.env.SF_USERNAME, process.env.SF_PASSWORD);

  // fetch FlowDefinition using Tooling API
  const flowDefinitions = await conn.tooling.query('SELECT Id, ActiveVersion.VersionNumber, LatestVersion.VersionNumber, DeveloperName FROM FlowDefinition');
  let records: any[] = flowDefinitions['records'];
  if ( argv.mode === 'on' ) {
    if ( fs.existsSync(DEFINITION_DATA_FILE_PATH) ) {
      records = JSON.parse(fs.readFileSync(DEFINITION_DATA_FILE_PATH, 'utf8'));
    }
  } else {
    if ( ! fs.existsSync(DEFINITION_DATA_FILE_PATH) ) {
      fs.writeFileSync(DEFINITION_DATA_FILE_PATH, JSON.stringify(flowDefinitions['records'], null, 2));
    }
  }

  records.forEach(function(flow: any) {
    const activeVersionNumber = argv.mode === 'on' ? flow['ActiveVersion']['VersionNumber'] : null;
    const res = conn.tooling.sobject('FlowDefinition').update({
      Id: flow['Id'],
      Metadata: {
        'activeVersionNumber': activeVersionNumber
      }
    });
  });
})();
