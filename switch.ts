import jsforce, { Connection, StandardSchema } from 'jsforce';
import * as dotenv from "dotenv";
dotenv.config({ path: __dirname+'/.env' });

(async () => {
  // Specify schema of connecting organization
  const conn = new Connection<StandardSchema>({
    loginUrl : 'https://' + process.env.DOMAIN + '.salesforce.com'
  });
  await conn.login(process.env.SF_USERNAME, process.env.SF_PASSWORD);

  // fetch records using find()
  const recs = await conn.sobject('Opportunity').find({
    CloseDate: { $lte: jsforce.Date.YESTERDAY },
    IsClosed: true
  });

  // output retrieved records info
  for (const rec of recs) {
    console.log(rec.Amount, rec.Name, rec.LastActivityDate);
  }
})();
