/**
 * MeetingController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const sails = require('sails');
const db = sails.getDatastore().manager;
var { ObjectID } = require("sails-mongo").mongodb;
const fileService = require('../services/fileService');

const { STATUS_ACTIVE, PROVIDER, STUDENT } = require('../codes');
const categories = require('../codes/categories');

module.exports = {
  messagesPage: (req, res) => {
    res.view('pages/messages', { layout: 'dashboardLayout', categories, PROVIDER, STUDENT, STATUS_ACTIVE, data: {} });
  },

  sendNewMessage: async (req, res) => {
    try {
      console.log('::: sendNewMessage :::');
      const { id: user1Id } = req.userData;
      const { text, email, fileName } = req.body;
     

      if (email && text) {
        const user2Data = await user.findOne({ email });

        if (user2Data && user2Data.id !== user1Id && text) {
          const { id: user2Id } = user2Data;
          console.log('user2Id : ', user2Id);

          const messageData = await messages.findOne({
            where: {
              or: [
                { user1: user1Id, user2: user2Id },
                { user1: user2Id, user2: user1Id },
              ],
              status: STATUS_ACTIVE
            },
          });
          console.log('messageData : ', messageData);

          let message = {
            text,
            type: 'user1',
            dateTime: Date.now(),
          }
          if(fileName){
            message.filename = fileName
          }

          if (messageData && messageData.user1) {
            message.type = (user1Id === messageData.user1 ? 'user1' : 'user2'),
            await db.collection('messages').update({ _id: ObjectID(messageData.id) }, {
              $push: {
                messages: message
              }
            });
          } else {
            const user1Data = await user.findOne({ id: user1Id });
            if (user1Data) {
              await messages.create({
                user1: user1Id,
                user2: user2Id,
                email1: user1Data.email,
                email2: user2Data.email,
                name1: user1Data.first_name + ' ' + user1Data.last_name,
                name2: user2Data.first_name + ' ' + user1Data.last_name,
                messages: [
                  message
                ],
                status: STATUS_ACTIVE,
              });
            } else {
              return res.send({
                status: false,
                message: 'User not found.',
              });
            }
          }
          return res.json({
            status: true,
            message: 'Message sent successfully',
          })
        }
      }
      return res.send({
        status: false,
        message: 'User not found.',
      });
    } catch (error) {
      sails.log.error('Error in send new message by email id : ', error);
      return res.send({
        status: false,
        message: 'Error in send new message by email id',
      });
    }
  },

  sendMessage: async (req, res) => {
    try {
      console.log('::: sendMessage :::');
      const { messageId } = req.params;
      const { id: userId } = req.userData;
      const { text, fileName } = req.body;
      
      if (messageId && text) {
        const messageData = await messages.findOne({ id: messageId, status: STATUS_ACTIVE });
        
        if (messageData && (messageData.user1 === userId || messageData.user2 === userId)) {
          let message =  {
            text,
            type: userId === messageData.user1 && 'user1' || 'user2',
            dateTime: Date.now(),
          }
          if(fileName){
            message.filename = fileName
          }

          await db.collection('messages').updateOne({ _id: ObjectID(messageId), status: STATUS_ACTIVE }, {
            $push: {
              messages: message
            }
          });

          return res.json({
            status: true,
            message: 'Message sent successfully',
          })
        }
      }

      return res.send({
        status: false,
        message: 'message thread not found.',
      });
    } catch (error) {
      sails.log.error('Error in send message : ', error);
      return res.send({
        status: false,
        message: 'Error in send message',
      });
    }
  },

  getMessagesList: async (req, res) => {
    try {
      console.log('::: getMessagesList :::');
      const { id: userId } = req.userData;

      const messagesList = await messages.find({
        where: {
          or: [
            { user1: userId },
            { user2: userId },
          ],
          status: STATUS_ACTIVE
        },
      });

      if (messagesList) {
        return res.json({
          status: true,
          data: messagesList,
        })
      }

      return res.send({
        status: false,
        message: 'messages not found.',
      });
    } catch (error) {
      sails.log.error('Error in get messages list : ', error);
      return res.send({
        status: false,
        message: 'Error in get messages list',
      });
    }
  },

  getMessages: async (req, res) => {
    try {
      console.log('::: getMessages :::');
      const { messageId } = req.params;
      const { id: userId } = req.userData;

      const messagesData = await messages.findOne({
        where: {
          id: messageId,
          status: STATUS_ACTIVE,
          or: [
            { user1: userId },
            { user2: userId },
          ],
        },
      });

      if (messagesData) {
        return res.json({
          status: true,
          data: messagesData,
        })
      }

      return res.send({
        status: false,
        message: 'messages not found.',
      });
    } catch (error) {
      sails.log.error('Error in get messages : ', error);
      return res.send({
        status: false,
        message: 'Error in get messages.',
      });
    }
  },
  uploadAttachment: function (req, res) {
  req.file('attcahment').upload({
    // don't allow the total upload size to exceed ~50MB
    // maxBytes: 50000000,
    maxBytes: 5000000000000000000,
    dirname: require('path').resolve('message_media')
  },function whenDone(err, uploadedFiles) {
    if (err) {
      return res.serverError(err);
    }
    // If no files were uploaded, respond with an error.
    if (uploadedFiles.length === 0){
      return res.json({
        status: false,
        message: `No file was uploaded`
      })
    } else {
      return res.json({
        status: true,
        message: `Successfully upload ${uploadedFiles.length} files`,
        data: uploadedFiles
      })
    }
  
  });
},
getFileMessageMedia: async (req, res) => {
  try {
    let { filename } = req.allParams();
    console.log('filename : ', filename);

    if (filename) {
      const filePath = await fileService.getFile('message_media', filename);
      if (filePath) {
        return res.sendFile(filePath);
      }
    }

    return res.status(404).send({
      status: false,
      message: 'file not found.',
    });
  } catch (error) {
    sails.log.error('Error in get file of meeting media : ', error);
    errorAlert(GET_FILEMEETING_MEDIA_ERROR_1, { ...req.params }, error);
    return res.status(500).send({
      status: false,
      message: 'Error in get file of meeting media',
    });
  }
},
};
