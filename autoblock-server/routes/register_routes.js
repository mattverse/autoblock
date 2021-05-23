const got = require('got');

//change all Request to 'got' module
const request = require("request");
const kakao = require('./kakao');
let database = require('../database/database');
const api = require('./api_calls');
const dateFormat = require("dateformat");
const {
  ReasonPhrases,
  StatusCodes,
  getReasonPhrase,
  getStatusCode,
} = require('http-status-codes');

const Alarmtalk = require('../services/alarmtalk');

module.exports = function (router, app) {

  //This function updates the un-finished user registeration info with
  //phone number and other info.
  const addPhone = function (
    database,
    got_user_name,
    got_phone_num,
    got_verification_code,
    input_current_month,
    input_current_date,
    callback
  ) {
    database.UserModel_profile.findOneAndUpdate({
        user_name: got_user_name,
      }, {
        phone_num: got_phone_num,
        verification_code: got_verification_code,
        register_month: input_current_month,
        register_date: input_current_date
      },
      function (err, response) {
        if (err) {
          callback(err, null);
          return;
        }
        callback(null, response);
      });
  };

  //This function is to veroify if the user has properly went through registration step
  //if the user has not been registered with a phone_num,
  //this function would return an error
  const verify_login = function (
    database,
    got_phone_num,
    callback
  ) {
    database.UserModel_profile.find({
      phone_num: got_phone_num
    }, function (err, user) {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, user);
    });
  }

  //finding user name and completing registration by adding
  //phone num and etc.
  const register_phone = function (
    database,
    got_user_name,
    got_verification_code,
    got_access_token,
    input_current_month,
    input_current_date,
    input_user_number,
    callback
  ) {
    database.UserModel_profile.findOneAndUpdate({
      user_name: got_user_name
    }, {
      verification_code: got_verification_code,
      access_token: got_access_token,
      register_month: input_current_month,
      register_date: input_current_date,
      require_login_again: false,
      phone_num: input_user_number
    }, function (err, res) {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, res);
    })
  }

//This function is called when the user is re-registering and doing
//phone verification
  const re_register_phone = function (
    database,
    got_user_name,
    got_verification_code,
    got_access_token,
    input_user_number,
    callback
  ) {
    database.UserModel_profile.findOneAndUpdate({
      user_name: got_user_name
    }, {
      verification_code: got_verification_code,
      access_token: got_access_token,
      require_login_again: false,
      phone_num: input_user_number
    }, function (err, res) {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, res);
    });
  }

  //adding the basic data for the user
  var addUser_profile = function (
    database,
    accesstoken,
    pageid,
    user_business_account_id,
    username,
    totalfollower,
    new_follower,
    is_Creator,
    facebook_Connected,
    callback
  ) {
    var temp_user = new database.UserModel_profile({
      accessToken: accesstoken,
      page_id: pageid,
      user_business_account_id: user_business_account_id,
      user_name: username,
      total_follower: totalfollower,
      new_follower: new_follower,
      is_creator: is_Creator,
      facebook_connected: facebook_Connected
    });
    temp_user.save(function (err, addedUser) {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, addedUser);
    });
  };

  //Fucntion is called when user is re-registering
  const addUser_reregister = function (
    database,
    accesstoken,
    pageid,
    user_business_account_id,
    username,
    totalfollower,
    new_follower,
    callback
  ) {
    database.UserModel_profile.findOneAndUpdate({
      user_name: username,

    }, {
      accessToken: accesstoken,
      page_id: pageid,
      user_business_account_id: user_business_account_id,
      total_follower: totalfollower,
      new_follower: new_follower
    }, function (err, addedUser) {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, addedUser);
    });
  }

  //deals with user when they are not properly connected with facebook
  const addUser_facebook_connected_false = function (
    database,
    accesstoken,
    pageid,
    user_business_account_id,
    is_Creator,
    facebook_Connected,
    callback
  ) {
    var temp_user = new database.UserModel_profile({
      accessToken: accesstoken,
      page_id: pageid,
      user_business_account_id: user_business_account_id,
      is_creator: is_Creator,
      facebook_connected: facebook_Connected
    });
    temp_user.save(function (err, addedUser) {
      if (err) {
        callback(err, null);
        return;
      }
      callback(null, addedUser);
    });
  };

  //Creates a random string that is used to create verification code
  function randomString() {
    const chars = "0123456789";
    const string_length = 6;
    let randomstring = "";
    for (var i = 0; i < string_length; i++) {
      let rnum = Math.floor(Math.random() * chars.length);
      randomstring += chars.substring(rnum, rnum + 1);
    }
    return randomstring;
  }

  const registerUser = ({res, database, access_token, user_page_id, user_ig_business_id, fb_call, user_name, facebook_connected, is_creator}) => {
    return database.UserModel_profile.exists({
      user_name: user_name
    }, function (err, doc) {
      if (err) console.log(err);
          //using exist method to see if the user is re-register our new
      //if doc exists, it means that the user is new
      else if (doc) {
        addUser_reregister(
            database,
            access_token,
            user_page_id,
            user_ig_business_id,
            fb_call.user_name,
            fb_call.total_follower,
            fb_call.new_follower,
            function (err, addedUser) {
              if (err) {
                console.log("Error while adding user");
                console.log(err);
              }
              if (addedUser) {

                res.cookie('user_name', user_name);
                res.status(204).send({
                  redirect: "/public/register.html",
                  user_name: user_name,
                  total_follower: fb_call.total_follower,
                  new_follower: fb_call.new_follower
                });
              }
            }
        )
      }


      //if the user is new,
      else {
        addUser_profile(
            database,
            access_token,
            user_page_id,
            user_ig_business_id,
            fb_call.user_name,
            fb_call.total_follower,
            fb_call.new_follower,
            is_creator,
            facebook_connected,
            function (err, addedUser) {
              if (err) {
                console.log("Error while adding user");
                console.log(err);
              }
              if (addedUser) {
                res.cookie('user_name', user_name);
                res.send({
                  redirect: "/public/register.html",
                  user_name: user_name,
                  total_follower: fb_call.total_follower,
                  new_follower: fb_call.new_follower
                });
              }
            }
        )
      }
    })
  }

  //First step of Facebook connection when registering for the service.
  //Returns info about what facebook pages the user has in his account.
  const fbconnect_2 = async (req, res, next) => {
    let accessToken;
    let userID;
    const database = app.get('database');

    //This is returned from front end, the results brought from facebook sdk installed in FE
    accessToken = req.body.test.authResponse.accessToken;
    userID = req.body.test.authResponse.userID;
    try {
      //Access Token Extension API Call
      //This API call extends the lifetime of access tokens
      const api_access_token_extension = await got("https://graph.facebook.com/v7.0/oauth/access_token", {
        searchParams: {
          grant_type: 'fb_exchange_token',
          client_id: '667617240634135',
          client_secret: 'b72a3a0f85fefdc547d1eb8b711690f0',
          fb_exchange_token: accessToken
        },
      });
      accessToken = JSON.parse(api_access_token_extension.body).access_token;

      //This API gives info about the pages the account has.
      const api_page_info = await got("https://graph.facebook.com/v7.0/me/accounts", {
        searchParams: {
          access_token: accessToken
        },
      });
      let page_list = [];
      //the page user has is returned in an array form
      for (i in JSON.parse(api_page_info.body).data) {
        let temp_login_data = {
          name: JSON.parse(api_page_info.body).data[i].name,
          category: JSON.parse(api_page_info.body).data[i].category,
          id: JSON.parse(api_page_info.body).data[i].id
        };
        page_list.push(temp_login_data);
        database.UserModel_profile.find({
          page_id: JSON.parse(api_page_info.body).data[i].id
        })
      }

      let isCreator = true;
      if (page_list.length == 0) isCreator = false;

      res.send({
        fb_page_id_list: JSON.parse(api_page_info.body).data,
        access_token: accessToken,
        isCreator: isCreator,
        page_list: page_list
      });
    } catch (error) {
      console.log("ERROR IN FBCONNECT2");
      console.log(error);
      res.send(error);
    }
  };
  router.post("/async_connect2", fbconnect_2);


  //Initial Login FB Data Fetching
  const fbconnect_3 = async (req, res, next) => {
    //If the user is Creator account
    if (req.body.test.isCreator) {

      //these are the data we have sent to FE in fbconnnect_2
      const selected = req.body.test.selected;
      const access_token = req.body.test.access_token;
      const fb_page_id_list = req.body.test.fb_page_id_list;

      //sends FE that the user does not have any page
      if (fb_page_id_list[selected] === undefined) {
        console.log("There is no facebook page to select");
        let user_name = "There is no facebook page to select";
        res.send({
          user_name: user_name
        });
      } else {

        const user_page_id = req.body.test.fb_page_id_list[selected].id;
        const access_token = req.body.test.access_token;

        try {
          const response = await got("https://graph.facebook.com/v7.0/" + user_page_id, {
            searchParams: {
              fields: "instagram_business_account",
              access_token: access_token
            },
          });
          //if the user's fb page is not connected with IG
          if (JSON.parse(response.body).instagram_business_account === undefined) {
            console.log("This facebook page is not Connected with instagram");
            let user_name = "This facebook page is not Connected with instagram";
            res.send({
              redirect: "/public/register.html",
              user_name: user_name
            });
          } else {
            const user_ig_business_id = JSON.parse(response.body).instagram_business_account.id;

            //If the user does not have a creator account
            if (user_ig_business_id == undefined) {
              console.log("User IG Business ID Is undefined");
              const database = app.get('database');
              let facebook_connected = false;
              let is_creator = true;
              let user_name = "This facebook page is not Connected with instagram";

              addUser_facebook_connected_false(
                database,
                access_token,
                user_page_id,
                user_ig_business_id,
                is_creator,
                facebook_connected,
                function (err, addedUser) {
                  if (err) console.log("Error while adding user : user_ig_business is undefined");
                  if (addedUser) {
                    res.send({
                      redirect: "/public/register.html",
                      user_name: user_name
                    });
                  }
                }
              );
            }

            //If the user is a Creator & FB Page connected
            else {
              const facebook_connected = true;
              const fb_call = await api.register(user_ig_business_id, access_token);
              const is_creator = true;
              const database = app.get('database');
              const user_name = fb_call.user_name;

              registerUser(
                  {
                    res,
                    facebook_connected,
                    fb_call,
                    is_creator,
                    database,
                    access_token,
                    user_ig_business_id,
                    user_name,
                    user_page_id
                  }
              );
            }
          }
        } catch (err) {
          console.log("==Error in Try Catch: ");
          console.log(err);
        }
      }
    } else {
      console.log("No Facebook Page");
      res.send("");
    }
  };

  router.post("/async_connect3", fbconnect_3);

  //semi-Last step of registeration
  //Receive Number from front end, create verification code, save to DB
  //Send user the verification code.
  router.route("/verification").post(function (req, res) {
    const database = app.get('database');

    const user_phone_num = req.body.test.phone_num;
    let user_country_code = req.body.test.country_code;
    const user_name = req.body.test.user_name;
    const access_token = req.body.test.access_token;
    user_country_code = "+82"
    const now = new Date();
    const correct_month = now.getMonth() + 1;
    const temp_month = "" + correct_month;
    const temp_date = "" + now.getDate();
    const current_date = dateFormat(now, "isoDateTime");

    database.UserModel_profile.find({
        user_name: user_name,
      },
      function (err, user) {
        //if the user phone num is not in the correct form
        if (isNaN(user_phone_num) || user_phone_num.length != 11) {
          console.log("400")
          res.send({
            result: "400",
          });
        } else {
          //If the user is going through re-login
          if (user[0].require_login_again) {
            //find user by verification code because the verification code does not change.
            //= Verification code is permanant
            database.UserModel_profile.findOneAndUpdate({
              verification_code: user[0].verification_code
            }, {
              //recording how many times the user has tried logging in
              $inc: {
                re_login: 1
              }
            }, function (err, response) {

              //using Twilio API to send verifiation code message
              let headersOpt = {
                "content-type": "application/json",
              };
              const veri = user[0].verification_code;
              const accountSid = 'AC0b95c31e53a273c99a7f109bd9b55876';
              const authToken = '55aab6f131b89548161a910a7e7f8c99';
              const twilio = require('twilio')(accountSid, authToken);
              twilio.messages
                .create({
                  body: veri + '을(를) 분석챗봇 미어캣 인증 번호로 입력하세요.',
                  from: '+17038316717',
                  to: user_country_code + user_phone_num
                }, function () {
                  re_register_phone(database, user_name, veri, access_token, user_phone_num, function (
                    err,
                    addedUser
                  ) {
                    if (err) {
                      console.log("Error while adding phone num");
                      console.log(err);
                    }
                    if (addedUser) {

                      //sending slack notification
                      request({
                        method: "post",
                        url: "https://hooks.slack.com/services/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",
                        headers: headersOpt,
                        json: true,
                        body: {
                          type: "mrkdwn",
                          text: "" + "<https://instagram.com/" + user_name + "|@" + user_name + "> 님이 재인증 했습니다. (누적  " + response.re_login + "회) (총 팔로워 " + user[0].total_follower + "명 / " + user[0].phone_num + ")"
                        }
                      }, function (err, response, body) {
                        res.send({
                          result: "200",
                        });
                      })
                    }
                  });
                });
            });
          }
          //NEW USER
          else {
            //saving down the conversion rate
            database.UserInfo_profile.update({
              name: 'counter'
            }, {
              $inc: {
                try_register: 1
              }
            }, {
              new: true
            }, function (err, doc) {
              if (err) console.log(err);
            });

            let veri = randomString();
            database.UserModel_profile.update({
              phone_num: user_phone_num
            }, {
              verification_code: veri,
            }, function (err, response) {

              //sending twilio for verification code
              const accountSid = 'AC0b95c31e53a273c99a7f109bd9b55876';
              const authToken = '55aab6f131b89548161a910a7e7f8c99';
              const twilio = require('twilio')(accountSid, authToken);
              twilio.messages
                .create({
                  body: veri + '을(를) 분석챗봇 미어캣 인증 번호로 입력하세요.',
                  from: '+17038316717',
                  to: user_country_code + user_phone_num
                }, function () {
                  register_phone(database, user_name, veri, access_token, temp_month, temp_date, user_phone_num, function (
                    err,
                    addedUser
                  ) {
                    if (err) {
                      console.log("Error while adding phone num");
                      console.log(err);
                    }
                    if (addedUser) {
                      //sending slack notification for new user
                      let headersOpt = {
                        "content-type": "application/json",
                      };
                      database.UserModel_profile.countDocuments({}, function (err, count) {
                        request({
                          method: "post",
                          url: "https://hooks.slack.com/services/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",
                          headers: headersOpt,
                          json: true,
                          body: {
                            type: "mrkdwn",
                            text: "" + count + "번째 유저가 가입했습니다!\n" +
                              "( " + "<https://instagram.com/" + user_name + "|@" + user_name + "> 님 / 총 팔로워 " + user[0].total_follower + "명 / " + user_phone_num + ")"
                          }
                        }, function (err, response, body) {
                          res.send({
                            result: "200",
                          });
                        })
                      })
                    }
                  });
                });
            });
          }
        }
      }
    );
  });


  //Finalization of registration
  router.route("/register_complete").post(function (req, res) {
    const database = app.get('database');
    const now = new Date();
    const temp_date = "" + now.getDate();

    const user_phone_num = req.body.test.phone_num;
    const verification_code = req.body.test.verification_code;

    database.UserModel_profile.find({
        phone_num: user_phone_num,
      },
      function (err, user) {

        let user_name = user[0].user_name;
        let total_follower = user[0].total_follower;

        //if the user has sent the right verification code
        if (user[0].verification_code == verification_code) {

          database.UserModel_profile.countDocuments({}, function (err, count) {

            //recording conversion rate
            if (user[0].register_date == temp_date) {
              database.UserInfo_profile.update({
                name: 'counter'
              }, {
                $inc: {
                  fin_register: 1
                }
              }, {
                new: true
              }, function (err, doc) {
                if (err) console.log(err);
              });
            }
            let headersOpt = {
              "content-type": "application/json",
            };

            let apiToken;

            //Sending KakaoTalk Initial Guide Message
            request({
              method: "post",
              url: "https://www.biztalk-api.com/v1/auth/getToken",
              headers: headersOpt,
              json: true,
              body: {
                bsid: "monkey_bs",
                passwd: "b61a54b2c1256b8e1942f1c2246fa4e51c9a5b91",
              },
            }, function (err, response, body) {
              let string = JSON.stringify(body);
              let objectValue = JSON.parse(string);
              request({
                  method: "post",
                  url: "https://www.biztalk-api.com/v1/auth/getToken",
                  headers: headersOpt,
                  json: true,
                  body: {
                    bsid: "monkey_bs",
                    passwd: "b61a54b2c1256b8e1942f1c2246fa4e51c9a5b91",
                  },
                },
                function (error, response, body) {
                  var string = JSON.stringify(body);
                  var objectValue = JSON.parse(string);
                  console.log(objectValue);
                  apiToken = objectValue["token"];
                  var headersOpt2 = {
                    "content-type": "application/json",
                    "bt-token": apiToken,
                  };
                  request({
                    method: "post",
                    url: "https://www.biztalk-api.com/v2/kko/sendAlimTalk",
                    headers: headersOpt2,
                    json: true,
                    body: {
                      msgIdx: "kko_alt_0002",
                      countryCode: "82",
                      recipient: user_phone_num,
                      senderKey: "d79ba4d97536e7060922a62fe2d542c08ccdec23",
                      message: "가입을 축하해요!\n\n" +
                        "1. 공지사항, 기능 업데이트, 이벤트 소식을 받기 위해서는 채널 추가를 꼭 해주세요.\n\n" +
                        "2. 가입후 이틀동안 데이터를 수집합니다. 조금만 기다려주시면 매일 점심마다 분석 리포트를 보내드립니다!\n\n" +
                        "3. 추천인 프로그램을 통해 인플루언서에게 미어캣을 소개해주세요. 가입시 포인트를 지급해 백화점 상품권으로 환급해드립니다.",
                      tmpltCode: "initial_register_4",
                      resMethod: "PUSH",
                    },
                  }, function (err, response, body) {
                    console.log("sent Kakao For: " + user_name);
                    res.send({
                      result: "200",
                    });
                  });
                }
              );
            });
          });
        }
        //if the user entered wrong verification code
        else {
          res.send({
            result: "400",
          });
        }
      }
    );
  });



  //Send Front End Number of DB Objects for Num count in Homepage
  router.route("/give_user_number").get(function (req, res) {
    var database = app.get('database');
    res.cookie('registered', true);
    database.UserModel_profile.countDocuments({}, function (err, result) {
      if (err) {
        console.log(err);
      } else {
        res.send({
          count: result + 1200,
        });
      }
    });
  });



  //NOT IN USE!!!
  //Checks cookie status and send it to front end for registration to see
  //which step of registration the user is at
  router.route("/checkCookie").get(function (req, res) {
    var stored_cookie_status = req.cookies.cookie_status;
    if (stored_cookie_status == 200) {
      res.send({
        cookie_status: stored_cookie_status,
        user_number: req.cookies.user_number,
      });
    } else if (stored_cookie_status == 300) {
      res.send({
        cookie_status: stored_cookie_status,
      });
    } else {
      res.send({
        cookie_status: 100,
      });
    }
  });




  //*******Below are APIs used in point pages*********/

  //used for logging in
  router.route("/login").post(function (req, res) {
    const database = app.get('database');
    const user_phone = req.body.data.user_phone;
    let user_country_code = req.body.data.country_code;

    const matches = user_country_code.match(/(\d+)/);
    user_country_code = "+" + matches[0];

    //find user by phone num
    database.UserModel_profile.find({
      phone_num: user_phone
    }, function (err, user) {

      if (user[0] == undefined) {
        res.send({
          result: "300"
        })
      } else {
        let server_id = user[0]._id;
        let user_name = user[0].user_name;
        let phone_num = user[0].phone_num;

        //if the phone number is not in the correct format
        if (isNaN(user_phone) || user_phone.toString().length != 10) {
          console.log("400");
          res.send({
            result: "400"
          });
        } else {

          //using twilio for sending veri code
          let veri = user[0].verification_code;
          const accountSid = 'AC0b95c31e53a273c99a7f109bd9b55876';
          const authToken = '55aab6f131b89548161a910a7e7f8c99';
          const twilio = require('twilio')(accountSid, authToken);
          twilio.messages
            .create({
              body: veri + '을(를) 분석챗봇 미어캣 인증 번호로 입력하세요.',
              from: '+17038316717',
              to: user_country_code + user_phone
            }, function () {
              verify_login(database, user_phone, function (
                err,
                addedUser
              ) {
                if (err) {
                  console.log("Error while adding phone num");
                  console.log(err);
                }
                if (addedUser) {
                  //cors setting to prevent error
                  res.set({
                    'access-control-allow-origin': '*'
                  });
                  res.send({
                    result: "200",
                    server_id: server_id,
                    user_name,
                    phone_num
                  });
                }
              });
            });
        }
      }
    });
  });
//same as below
  router.route("/login").get(function (req, res) {
    const database = app.get('database');
    const user_phone = req.body.data.user_phone;
    let user_country_code = req.body.data.country_code;
    const matches = user_country_code.match(/(\d+)/);
    user_country_code = "+" + matches[0];

    database.UserModel_profile.find({
      phone_num: user_phone
    }, function (err, user) {
      if (user[0] == undefined) {
        res.send({
          result: "300"
        })
      }
      const server_id = user[0]._id;
      const user_name = user[0].user_name;
      const phone_num = user[0].phone_num;

      if (isNaN(user_phone) || user_phone.toString().length != 10) {
        console.log("400");
        res.send({
          result: "400"
        });
      } else {
        //sending twilio
        const veri = user[0].verification_code;
        const accountSid = 'AC0b95c31e53a273c99a7f109bd9b55876';
        const authToken = '55aab6f131b89548161a910a7e7f8c99';
        const twilio = require('twilio')(accountSid, authToken);
        twilio.messages
          .create({
            body: veri + '을(를) 분석챗봇 미어캣 인증 번호로 입력하세요.',
            from: '+17038316717',
            to: user_country_code + user_phone
          }, function () {
            verify_login(database, user_phone, function (
              err,
              addedUser
            ) {
              if (err) {
                console.log("Error while adding phone num");
                console.log(err);
              }
              if (addedUser) {
                res.set({
                  'access-control-allow-origin': '*'
                });
                res.send({
                  result: "200",
                  server_id: server_id,
                  user_name,
                  phone_num
                });
              }
            });
          });
      }
    });
  });

  //used to verify the verification code entered by user
  router.route("/login_verification").post(function (req, res) {
    const database = app.get('database');
    const server_id = req.body.data.server_id;
    const user_verification = req.body.data.verification_code;
    //communicating with FE with Server Id
    database.UserModel_profile.find({
      _id: server_id
    }, function (err, user) {
      if (user[0].verification_code === user_verification) {
        res.send({
          result: "200"
        })
      } else {
        res.set({
          'access-control-allow-origin': '*'
        });
        res.send({
          result: "400"
        });
      }
    });
  });

  router.route("/login_verification").get(function (req, res) {
    const database = app.get('database');
    const server_id = req.body.data.server_id;
    const user_verification = req.body.data.verification_code;

    database.UserModel_profile.find({
      _id: server_id
    }, function (err, user) {
      if (user[0].verification_code === user_verification) {
        res.set({
          'access-control-allow-origin': '*'
        });
        res.send({
          result: "200"
        })
      } else {
        res.set({
          'access-control-allow-origin': '*'
        });
        res.send({
          result: "400"
        });
      }
    });
  });


  //this API is used when adding points to user
  router.route("/add_point").post(function (req, res) {
    const database = app.get('database');
    const user_verification_code = "" + req.body.data.verification_code;
    const sent = req.body.data.user_name;

    //"Sent" = the person who logged in using invitation code
    //"receive" = the person who is obtaining the point

    //find the user who has logged in using verification code,
    //and find the total follower of the person who sent the code
    database.UserModel_profile.find({
      user_name: sent
    }, function (err, user) {
      let user_follower = user[0].total_follower;
      let obtain_point;
      //point added depending on follower
      if(user_follower < 20000) obtain_point = 1000;
      else obtain_point = Math.floor(user_follower / 10000) * 1000;

      database.UserModel_profile.findOneAndUpdate({
        verification_code: user_verification_code
      }, {
        $inc: {
          point: obtain_point
        }
      }, function (err, user) {
        //saving data for who sent how much for point history of user in PointHistory_profile model DB
        var temp_user = new database.PointHistory_profile({
          receive: user.user_name,
          sent: sent,
          sent_amount: obtain_point
        });
        temp_user.save(function (err, addedUser) {
          if (err) {
            console.log(err);

            res.set({
              'access-control-allow-origin': '*'
            });
            res.send({
              result: "400"
            })
          } else {
            res.set({
              'access-control-allow-origin': '*'
            });
            res.send({
              result: "200"
            });
          }
        });
      });
    });
  });


  //Getting the Total point from PointHistory_profile model DB
  router.route("/point_view").post(function (req, res) {
    const database = app.get('database');
    const server_id = req.body.data.server_id;
    database.UserModel_profile.findById(server_id).lean().exec(function (err, result) {
      if (err) console.log(err);
      res.set({
        'access-control-allow-origin': '*'
      });
      res.send({
        point: result.point
      })
    })
  });
  router.route("/point_view").get(function (req, res) {
    const database = app.get('database');
    const server_id = req.body.data.server_id;
    database.UserModel_profile.findById(server_id).lean().exec(function (err, result) {
      res.set({
        'access-control-allow-origin': '*'
      });
      res.send({
        point: result.point
      })
    })
  });


  //API used when the user asked for cashback
  router.route("/user_cashback").post(function (req, res) {
    const database = app.get('database');
    const server_id = req.body.data.server_id;

    database.UserModel_profile.find({
      _id: server_id
    }, function (err, user) {
      //point cashback is done in units of "50,000"
      //calculating how much should be given, how much should be left
      let user_point = user[0].point;
      let left_point = user_point % 50000;
      let to_give = Math.floor(user_point / 50000);
      to_give = 50000 * to_give;
      database.UserModel_profile.findOneAndUpdate({
        _id: server_id
      }, {
        point: left_point
      }, function (err, user) {
        //user cashback data is saved in PointAdmin_profile model DB
        let temp_user = new database.PointAdmin_profile({
          user_name: user.user_name,
          point: to_give
        });
        temp_user.save(function (err, addedUser) {
          if (err) {
            res.set({
              'access-control-allow-origin': '*'
            });
            res.send({
              result: "400"
            })
          } else {
            res.set({
              'access-control-allow-origin': '*'
            });
            res.send({
              result: "200"
            });
          }
        })
      });
    })
  });

  //This API is called when loading point view page by the user
  router.route("/point_table").post(function (req, res) {
    const database = app.get('database');
    const server_id = req.body.data.server_id;
    database.UserModel_profile.find({
      _id: server_id
    }, function (err, response) {
      var user_name = response[0].user_name;
      database.PointHistory_profile.find({
        receive: user_name
      }, function (err, response) {
        res.set({
          'access-control-allow-origin': '*'
        });
        res.send({
          response: response
        });
      });
    });
  });
  router.route("/point_table").get(function (req, res) {
    var database = app.get('database');
    var server_id = req.body.data.server_id;
    database.UserModel_profile.find({
      _id: server_id
    }, function (err, response) {
      var user_name = response[0].user_name;
      database.PointHistory_profile.find({
        receive: user_name
      }, function (err, response) {
        res.set({
          'access-control-allow-origin': '*'
        });
        res.send({
          response: response
        });
      });
    });
  });


//This API is called when the user is changing his/her phone num
  router.route("/user_change").post(function (req, res) {
    const database = app.get('database');
    const server_id = req.body.data.server_id;
    const change_number = req.body.data.change_number;
    let user_country_code = "+82"
    database.UserModel_profile.find({
      _id: server_id
    }, function (err, user) {
      //if the phone number they are trying to change is same as the original number,
      //send 400
      if (user[0].phone_num == change_number) {
        res.send("400")
      }
      //else, send a verification code to authorize new phone
      else {
        let veri = user[0].verification_code;
        var accountSid = 'AC0b95c31e53a273c99a7f109bd9b55876';
        var authToken = '55aab6f131b89548161a910a7e7f8c99';
        var twilio = require('twilio')(accountSid, authToken);
        twilio.messages
          .create({
            body: veri + '을(를) 분석챗봇 미어캣 인증 번호로 입력하세요.',
            from: '+17038316717',
            to: user_country_code + change_number
          }, function () {
            res.send({ result: "200"});
          });
      }
    });
  });

  //This API is called when the user is trying to confirm their new phoen num
  router.route("/user_change_confirm").post(function(req,res){
    const database = app.get("database");
    const server_id = req.body.data.server_id;
    const change_number = req.body.data.change_number;
    const verification_code = req.body.data.verification_code;
    database.UserModel_profile.find({
      _id : server_id
    }, function(err, user){
      //if the verification code is different
      if(user[0].verification_code != verification_code){
        res.send("400")
      }
      //if the verification code is the same,
      else{
        //update phone num and send 200
        database.UserModel_profile.updateOne({
          _id : server_id
        },
        {
          phone_num: change_number
        }, function(err, response){
          res.send({ result: "200"}
            );
        })
      }
    })
  })

  //deals with user when they are not properly connected with facebook
  router.route('/save_kakao_user').post(async (req, res) => {
    const database = app.get('database');
    try {
      const account = await database.KakaoAccount.findOne({provider_id: req.body.data.provider_id});

      if (req.body.data.phone) {
        const phone = "0" + req.body.data.phone.split(" ")[1].split("-").join('');
        const isExist = await database.UserModel_profile.exists({phone_num: phone});
        if (!isExist) {
          Alarmtalk.sendMessage(req.body.data.nickname, phone).catch(console.error);
        }
      }

      if (!account) {
        const newAccount = await database.db.collections.kakao_accounts.insertOne(req.body.data);

        return res.status(StatusCodes.CREATED).send(newAccount);
      }

      return res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(ReasonPhrases.INTERNAL_SERVER_ERROR);
    }
  });

  router.route('/register_user').post(async (req, res) => {
    const database = app.get('database');

    try {
      const fb_call = await api.register(req.body.user_ig_business_id, req.body.access_token);
      await registerUser({res, database, fb_call, ...req.body});
    } catch (e) {
      console.error(e);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(ReasonPhrases.INTERNAL_SERVER_ERROR);
    }
  })
}