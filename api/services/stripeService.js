const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

var fs = require('fs');
const dirname = process.cwd();

const { errorAlert } = require('../utils/userActivityLog')
const { STRIPE_CREATE_TOKEN, STRIPE_CARD_ADD_ERROR_1, STRIPE_CARD_GET_ERROR_1, SRIPE_CREATE_CUSTOMER_1, STRIPE_CARD_DELETE_ERROR_1, GET_STRIPE_ACCOUNT_ERROR_1,
  UPDATE_STRIPE_ACCOUNT_ERROR_1, ADD_STRIPE_BANK_ACCOUNT_ERROR_1, SRIPE_CREATE_TRANSFER, STRIPE_ERROR, UPDATE_STRIPE_BANK_ACCOUNT_ERROR_1 } = require('../codes')

module.exports.createToken = async (token_info) => {
  try {
    console.log('token_info : ', token_info);
    const data = {};
    if (token_info.bank_account) {
      const { country, currency, account_holder_name, routing_number, account_number } = token_info.bank_account;

      data.bank_account = {
        country,
        currency,
        account_holder_name,
        account_holder_type: 'individual',
        // routing_number: 'HDFC0000261', // india testing account
        // account_number: '123456788',
        // routing_number: '110000000', // USA testing account
        // account_number: '000123456789',
        routing_number,
        account_number,
      }
    }
    return new Promise((resolve, reject) => {
      stripe.tokens.create(
        data,
        function (err, token) {
          if (err) {
            console.log('err : ', err);
            return resolve(err);
          }

          console.log('stripe create token response : ', token);
          resolve(token);
        }
      );
    })
  } catch (error) {
    errorAlert(STRIPE_CREATE_TOKEN, token_info.bank_account, error)
    sails.log.error('Error in stripe create token : ', error);
    reject(error);
  }
};

module.exports.createCustomer = async (customer_info) => {
  try {
    console.log('customer_info : ', customer_info);
    return new Promise((resolve, reject) => {
      stripe.customers.create(
        customer_info,
        function (err, customer) {
          if (err) {
            console.log('err : ', err);
            errorAlert(STRIPE_ERROR, {}, err)
            return reject(err);
          }

          console.log('stripe create customer response : ', customer);
          resolve(customer);
        }
      );
    })
  } catch (error) {
    delete customer_info.address;
    errorAlert(SRIPE_CREATE_CUSTOMER_1, { ...customer_info }, error)
    sails.log.error('Error in stripe create customer : ', error);
    return error;
  }
};

module.exports.getCustomer = async (customerId) => {
  try {
    console.log('account_info : ', customerId);

    return new Promise((resolve, reject) => {
      stripe.customers.retrieve(
        customerId,
        function (err, customer) {
          if (err) {
            console.log('err : ', err);
            errorAlert(STRIPE_ERROR, {}, err)
            return reject(err);
          }

          resolve(customer);
        }
      );
    })
  } catch (error) {
    sails.log.error('Error in stripe get customer details : ', error);
    reject(error);
  }
};

module.exports.updateCustomer = async (customerId, customer_info) => {
  try {
    console.log('account_info : ', customerId, customer_info);
    return new Promise((resolve, reject) => {
      stripe.customers.update(
        customerId,
        customer_info,
        function (err, response) {
          if (err) {
            console.log('err : ', err);
            errorAlert(STRIPE_ERROR, {}, err)
            return reject(err);
          }

          console.log('stripe customer update response : ', response);
          resolve(response);
        }
      );
    })
  } catch (error) {
    sails.log.error('Error in stripe customer update : ', error);
    reject(error);
  }
};

module.exports.getCustomerAllCards = async (customerId) => {
  try {
    console.log('account_info : ', customerId);
    const data = {
      object: 'card'
    }

    return new Promise((resolve, reject) => {
      stripe.customers.listSources(
        customerId,
        data,
        function (err, cards) {
          if (err) {
            console.log('err : ', err);
            errorAlert(STRIPE_ERROR, {}, err)
            return reject(err);
          }

          resolve(cards);
        }
      );
    })
  } catch (error) {
    errorAlert(STRIPE_CARD_GET_ERROR_1, { customerId: customerId }, error)
    sails.log.error('Error in stripe customer get all cards : ', error);
    return error;
  }
};

module.exports.addCustomerCard = async (customerId, sourceToken) => {
  try {
    console.log('account_info : ', sourceToken, customerId);
    const data = {
      source: sourceToken, // bank account token
    };

    return new Promise((resolve, reject) => {
      stripe.customers.createSource(
        customerId,
        data,
        function (err, card) {
          if (err) {
            console.log('err : ', err);
            errorAlert(STRIPE_ERROR, {}, err)
            return reject(err);
          }

          console.log('stripe customer add card response : ', card);
          resolve(card);
        }
      );
    })
  } catch (error) {
    errorAlert(STRIPE_CARD_ADD_ERROR_1, { customerId }, error)
    sails.log.error('Error in stripe customer add card : ', error);
    return error;
  }
};

module.exports.updateCustomerCard = async (customerId, cardId, card_info) => {
  try {
    console.log('account_info : ', cardId, customerId, card_info);
    return new Promise((resolve, reject) => {
      stripe.customers.updateSource(
        customerId,
        cardId,
        card_info,
        function (err, response) {
          if (err) {
            console.log('err : ', err);
            errorAlert(STRIPE_ERROR, {}, err)
            return reject(err);
          }

          console.log('stripe customer update card response : ', response);
          resolve(response);
        }
      );
    })
  } catch (error) {
    sails.log.error('Error in stripe customer update card : ', error);
    reject(error);
  }
};

module.exports.deleteCustomerCard = async (customerId, cardId) => {
  try {
    console.log('account_info : ', cardId, customerId);
    return new Promise((resolve, reject) => {
      stripe.customers.deleteSource(
        customerId,
        cardId,
        function (err, response) {
          if (err) {
            console.log('err : ', err);
            errorAlert(STRIPE_ERROR, {}, err)
            return reject(err);
          }

          console.log('stripe customer delete card response : ', response);
          resolve(response);
        }
      );
    })
  } catch (error) {
    errorAlert(STRIPE_CARD_DELETE_ERROR_1, { customerId: customerId, cardId: cardId }, error)
    sails.log.error('Error in stripe customer delete card : ', error);
    return error;
  }
};

module.exports.createCharge = async (payment_info) => {
  try {
    console.log('payment_info : ', payment_info);
    const { amount, currency, description, customer, source } = payment_info;
    const data = { amount: (amount * 100).toFixed(0), currency, description };
    if (customer) data.customer = customer;
    if (source) data.source = source;

    data.shipping = {
      name: 'Sumeet Khurana',
      address: {
        line1: 'Stallion Group LLC',
        line2: '2353 berkshire lane',
        city: 'north Brunswick',
        state: 'New Jersey',
        country: 'us',
        postal_code: '08902',
      }
    }

    return new Promise((resolve, reject) => {
      stripe.charges.create(
        data,
        function (err, charge) {
          if (err) {
            console.log('err : ', err);
            errorAlert(STRIPE_ERROR, {}, err)
            return reject(err);
          }

          console.log('stripe create charge response : ', charge);
          resolve(charge);
        }
      );
    })
  } catch (error) {
    sails.log.error('Error in stripe create charge : ', error);
    reject(error);
  }
};

module.exports.createAccount = async (account_info) => {
  try {
    console.log('account_info : ', account_info);
    const { url, line1, line2, postal_code, dob, id_number, state, sourceToken, country, email, phone, city, first_name, last_name, clientIp } = account_info;
    const front = await this.createFile(dirname + '/assets/img/verification_document1.png', 'identity_document');
    const back = await this.createFile(dirname + '/assets/img/verification_document2.png', 'identity_document');
    const data = {
      type: 'custom',
      country,
      email,
      requested_capabilities: [
        'card_payments',
        'transfers',
      ],
      business_type: 'individual',
      business_profile: {
        mcc: '5734', // static
        url,
      },
      individual: {
        first_name,
        last_name,
        email,
        phone,
        ssn_last_4: id_number,
        address: {
          line1,
          line2,
          city,
          country,
          state,
          postal_code,
        },
        dob,
        verification: {
          document: {
            front: front.id, // static
            back: back.id, // static
          }
        }
      },
      external_account: sourceToken, // bank account token
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: clientIp,
      }
    };

    return new Promise((resolve, reject) => {
      stripe.accounts.create(
        data,
        function (err, account) {
          if (err) {
            console.log('err : ', err);
            errorAlert(STRIPE_ERROR, {}, err)
            return resolve(err);
          }

          console.log('stripe create account response : ', account);
          resolve(account);
        }
      );
    })
  } catch (error) {
    sails.log.error('Error in stripe create account : ', error);
    reject(error);
  }
};

module.exports.updateAccount = async (accountId, account_info) => {
  try {
    console.log('account_info : ', account_info);
    const { url, phone, id_number, postal_code, dob, line1, line2, city, state, sourceToken } = account_info;
    const data = {
      business_profile: {
        url,
      },
      individual: {
        phone,
        ssn_last_4: id_number,
        address: {
          line1,
          line2,
          city,
          state,
          postal_code,
        },
        dob,
      },
    };

    if (sourceToken) {
      data.external_account = sourceToken; // bank account token
    }

    return new Promise((resolve, reject) => {
      stripe.accounts.update(
        accountId,
        data,
        function (err, account) {
          if (err) {
            console.log('err : ', err);
            errorAlert(STRIPE_ERROR, {}, err)
            return reject(err);
          }

          console.log('stripe update account response : ', account);
          resolve(account);
        }
      );
    })
  } catch (error) {
    errorAlert(UPDATE_STRIPE_ACCOUNT_ERROR_1, { accountId: accountId, ...account_info }, error)
    sails.log.error('Error in stripe update account : ', error);
    return error;
  }
};

module.exports.getAllBankAccount = async (accountId) => {
  try {
    console.log('account_info : ', accountId);
    const data = {
      object: 'bank_account'
    }

    return new Promise((resolve, reject) => {
      stripe.accounts.listExternalAccounts(
        accountId,
        data,
        function (err, bankAccounts) {
          if (err) {
            errorAlert(STRIPE_ERROR, {}, err)
            console.log('err : ', err);
            return reject(err);
          }

          resolve(bankAccounts);
        }
      );
    })
  } catch (error) {
    errorAlert(GET_STRIPE_BANK_ACCOUNT_ERROR_1, { accountId: accountId }, error)
    sails.log.error('Error in stripe get all bank accounts : ', error);
    reject(error);
  }
};

module.exports.addBankAccount = async (accountId, sourceToken) => {
  try {
    console.log('account_info : ', sourceToken, accountId);
    const data = {
      external_account: sourceToken, // bank account token
    };

    return new Promise((resolve, reject) => {
      stripe.accounts.createExternalAccount(
        accountId,
        data,
        function (err, bankAccount) {
          if (err) {
            console.log('err : ', err);
            errorAlert(STRIPE_ERROR, {}, err)
            return reject(err);
          }

          console.log('stripe add bank account response : ', bankAccount);
          resolve(bankAccount);
        }
      );
    })
  } catch (error) {
    sails.log.error('Error in stripe add bank account : ', error);
    errorAlert(ADD_STRIPE_BANK_ACCOUNT_ERROR_1, { accountId: accountId, sourceToken }, error)
    return error;
  }
};

module.exports.updateBankAccount = async (accountId, bankAccountId, bank_account_info) => {
  try {
    console.log('account_info : ', bankAccountId, accountId, bank_account_info);
    return new Promise((resolve, reject) => {
      stripe.accounts.updateExternalAccount(
        accountId,
        bankAccountId,
        bank_account_info,
        function (err, response) {
          if (err) {
            console.log('err : ', err);
            errorAlert(STRIPE_ERROR, {}, err)
            return reject(err);
          }

          console.log('stripe update bank account response : ', response);
          resolve(response);
        }
      );
    })
  } catch (error) {
    errorAlert(UPDATE_STRIPE_BANK_ACCOUNT_ERROR_1, { accountId: accountId, bankAccountId: bankAccountId, ...bank_account_info }, error)
    sails.log.error('Error in stripe update bank account : ', error);
    return error;
  }
};

module.exports.deleteBankAccount = async (accountId, bankAccountId) => {
  try {
    console.log('account_info : ', bankAccountId, accountId);
    return new Promise((resolve, reject) => {
      stripe.accounts.deleteExternalAccount(
        accountId,
        bankAccountId,
        function (err, response) {
          if (err) {
            console.log('err : ', err);
            errorAlert(STRIPE_ERROR, {}, err)
            return reject(err);
          }

          console.log('stripe delete bank account response : ', response);
          resolve(response);
        }
      );
    })
  } catch (error) {
    sails.log.error('Error in stripe delete bank account : ', error);
    reject(error);
  }
};

module.exports.getAccount = async (accountId) => {
  try {
    return new Promise((resolve, reject) => {
      stripe.accounts.retrieve(
        accountId,
        function (err, account) {
          if (err) {
            console.log('err : ', err);
            errorAlert(STRIPE_ERROR, {}, err)
            return reject(err);
          }

          resolve(account);
        }
      );
    })
  } catch (error) {
    errorAlert(GET_STRIPE_ACCOUNT_ERROR_1, { accountId }, error)
    sails.log.error('Error in stripe get account : ', error);
    return error;
  }
};

module.exports.createFile = async (dir, purpose) => {
  var fp = fs.readFileSync(dir);
  var file = await stripe.files.create({
    purpose,
    file: {
      data: fp,
      name: 'file.jpg',
      type: 'application/octet-stream',
    },
  });
  return file;
}

module.exports.createTransfer = async (transfer_info) => {
  try {
    console.log('transfer_info : ', transfer_info);
    const { amount, currency, destination, description } = transfer_info;
    const data = { amount: (amount * 100).toFixed(0), currency, destination, description };

    return new Promise((resolve, reject) => {
      stripe.transfers.create(
        data,
        function (err, transfer) {
          if (err) {
            console.log('err : ', err);
            errorAlert(STRIPE_ERROR, {}, err)
            return reject(err);
          }

          resolve(transfer);
        }
      );
    })
  } catch (error) {
    errorAlert(SRIPE_CREATE_TRANSFER, { ...transfer_info }, error)
    sails.log.error('Error in stripe create transfer : ', error);
    reject(error);
  }
};