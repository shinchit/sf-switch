import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as xml2json from "xml2json";
import * as yargs from "yargs";
import * as jsforce from "jsforce";
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname+'/.env' });

// accept command line arguments
let { argv } = <any>{};
argv = yargs
  .option("mode", {
    description: "required. You have to specify running mode 'off' or 'return'",
    demandOption: false,
    default: "off"
  })
  .help().argv;

const DEFINITION_DATA_FILE_PATH = './data/' + process.env.SF_USERNAME + '_define.json';
const TRIGGER_DEFINITION_DATA_FILE_PATH = './data/' + process.env.SF_USERNAME + '_trigger_define.json';
const METADATA_PACKAGE_DIR = './data/package/';
const METADATA_PACKAGE_TRIGGER_DIR = METADATA_PACKAGE_DIR + 'triggers/';

(async () => {
  const conn = new jsforce.Connection({
    loginUrl : 'https://' + process.env.DOMAIN + '.salesforce.com'
  });
  await conn.login(process.env.SF_USERNAME, process.env.SF_PASSWORD);

  /* fetch FlowDefinition (Process) using Tooling API */
  const flowDefinitions = await conn.tooling.query('SELECT Id, ActiveVersion.VersionNumber, LatestVersion.VersionNumber, DeveloperName FROM FlowDefinition');
  let records: any[] = flowDefinitions['records'];
  if ( argv.mode !== 'off' ) {
    if ( fs.existsSync(DEFINITION_DATA_FILE_PATH) ) {
      try {
        records = JSON.parse(fs.readFileSync(DEFINITION_DATA_FILE_PATH, 'utf8'));
        fs.unlinkSync(DEFINITION_DATA_FILE_PATH);
      } catch (err) {
        console.log(`The read or unlink process has failed. Please check ${DEFINITION_DATA_FILE_PATH}`);
      }
    }
  } else {
    if ( ! fs.existsSync(DEFINITION_DATA_FILE_PATH) ) {
      fs.writeFileSync(DEFINITION_DATA_FILE_PATH, JSON.stringify(flowDefinitions['records'], null, 2));
    }
  }

  records.forEach(function(flow: any) {
    const activeVersionNumber = argv.mode !== 'off' ? flow['ActiveVersion']['VersionNumber'] : null;
    const res = conn.tooling.sobject('FlowDefinition').update({
      Id: flow['Id'],
      Metadata: {
        'activeVersionNumber': activeVersionNumber
      }
    });
  });


  /* retrieve triggers metadata */
  execSync(`./node_modules/jsforce-metadata-tools/bin/jsforce-retrieve -u ${process.env.SF_USERNAME} -p ${process.env.SF_PASSWORD} --memberTypes "ApexTrigger:*" --sandbox -D ${METADATA_PACKAGE_DIR}`);

  const dirents = fs.readdirSync(METADATA_PACKAGE_TRIGGER_DIR, {withFileTypes: true});

  const trigger_files = [];
  for ( const dirent of dirents ) {
    if ( ! dirent.isDirectory() ) {
      const trigger_file = METADATA_PACKAGE_TRIGGER_DIR + dirent.name;
      trigger_files.push(trigger_file);
    }
  }
  const xml_files = trigger_files.filter(function(file) {
    return path.extname(file).toLowerCase() === '.xml';
  });

  let jsons = xml_files.map(function(xml_file) {
    const xml = fs.readFileSync(xml_file, 'utf-8');
    return xml2json.toJson(xml, {object: true, reversible: true, arrayNotation: true});
  });

  if ( argv.mode === 'off' ) {
    // save present status
    if ( ! fs.existsSync(TRIGGER_DEFINITION_DATA_FILE_PATH) ) {
      fs.writeFileSync(TRIGGER_DEFINITION_DATA_FILE_PATH, JSON.stringify(jsons, null, 2));
    }

    // change status
    jsons = jsons.map(function(json: any) {
      json['ApexTrigger'][0]['status'][0]["$t"] = 'Inactive';
      return json;
    });
  } else {
    if ( fs.existsSync(TRIGGER_DEFINITION_DATA_FILE_PATH) ) {
      try {
        jsons = JSON.parse(fs.readFileSync(TRIGGER_DEFINITION_DATA_FILE_PATH, 'utf8'));
        fs.unlinkSync(TRIGGER_DEFINITION_DATA_FILE_PATH);
      } catch (err) {
        console.log(`The read or unlink process has failed. Please check ${TRIGGER_DEFINITION_DATA_FILE_PATH}`);
      }
    }
  }

  for ( let i = 0; i < jsons.length; i++ ) {
    fs.writeFileSync(xml_files[i], '<?xml version="1.0" encoding="UTF-8"?>\n' + xml2json.toXml(jsons[i]));
  }

  /* deploy triggers metadata */
  execSync(`./node_modules/jsforce-metadata-tools/bin/jsforce-deploy -u ${process.env.SF_USERNAME} -p ${process.env.SF_PASSWORD} --sandbox -D ${METADATA_PACKAGE_DIR}`);

})();
