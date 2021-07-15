
var cron = require('node-cron');
const sails = require('sails');

const stripeService = require('./stripeService');

if(process.env.IS_CRONE_ACTIVE == 'true'){
  cron.schedule('0 12 * * *', async () => {
    try {
      const db = sails.getDatastore().manager;

      const chargePer = +process.env.PROVIDER_CHARGE_PER;

      const providersData = await providerTransactions.find({ balance: { '>=': 1 } });
      console.log('providersData : ', providersData);

      for (let index = 0; index < providersData.length; index++) {
        const providerData = providersData[index];
        const provider = await user.findOne({ id: providerData.userId });

        if (provider && provider.stripeAccId) {
          const { stripeAccId } = provider;
          const stripeAccount = await stripeService.getAccount(stripeAccId);

          if (stripeAccount && stripeAccount.payouts_enabled && stripeAccount.country === 'US' && stripeAccount.capabilities && stripeAccount.capabilities.transfers === "active") {
            console.log('stripeAccount.id: ', stripeAccount.id);

            const { default_currency } = stripeAccount;
            const { balance } = providerData;
            const charge = +(balance * chargePer / 100).toFixed(2);
            const netAmount = +(balance - charge).toFixed(2);

            const transfer_info = {
              amount: netAmount,
              currency: default_currency,
              destination: stripeAccId,
              description: `Balance transferred of ${default_currency} ${netAmount}`
            };
            const transferData = await stripeService.createTransfer(transfer_info);
            if (transferData) {
              console.log('transferData : ', transferData);

              if (transferData.id) {
                const providerTransferData = {
                  netAmount,
                  balance,
                  currency: default_currency,
                  chargePer,
                  charge,
                  transferId: transferData.id
                }
                await db.collection('providertransactions').update({ userId: providerData.userId }, { $push: { paymentRedeem: providerTransferData } });
                await db.collection('providertransactions').update({ userId: providerData.userId }, { $inc: { balance: -balance } });
              }
            }
          }
        }
      }
    } catch (error) {
      sails.log.error('Error in provider transfer crone : ', error);
    }
  });
}