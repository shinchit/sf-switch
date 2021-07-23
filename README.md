# sf-switch
A script that disables the Salesforce process, ApexTrigger in bulk, and restores the state before invalidation.

# usage

## setting

```bash
$ git clone https://github.com/shinchit/sf-switch.git
$ cd sf-switch/
$ cat > .env
DOMAIN=<login or test. Specify `login` for production organization>
SF_USERNAME=<`Login ID of the SF` organization to be operated>
SF_PASSWORD=<`Password of the SF` organization to be operated>
$ npm i
```

## execute

`$ npx tsc`

- disable processes and ApexTriggers at once  
`$ node switch.js --mode off`
- restore processes and ApexTriggers at once  
`$ node switch.js --mode return`

## Note

This script can only inactivate Apex Trigger, which is unmanaged as packaged.
Please note that ApexTrigger, an external package introduced by AppExchange etc., cannot be inactived.
