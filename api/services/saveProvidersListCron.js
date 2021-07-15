
var cron = require('node-cron');
const sails = require('sails');
const cache = require('memory-cache');

const { STATUS_ACTIVE, PROVIDER } = require('../codes');

async function saveProvidersList() {
  const providers = await user.find({
    where: {
      role: PROVIDER,
      status: STATUS_ACTIVE,
    },
  });
  if (providers) {
    cache.put('providersList', providers.map(item => {
      return {
        full_name: item.full_name,
        email: item.email,
        keywords: item.keywords,
        cat: item.cat && item.cat.map(ca => ca.name).join(','),
        subCat: item.subCat && item.subCat.map(sca => sca.name).join(','),
      }
    }));
  }
}

module.exports = {
  saveProvidersList
}
if(process.env.IS_CRONE_ACTIVE == 'true'){
  cron.schedule('*/30 * * * *', async () => {
    try {
      console.log('Running saveProvidersList');
      await saveProvidersList();
    } catch (error) {
      sails.log.error('Error in saveProvidersList crone : ', error);
    }
  });
}
