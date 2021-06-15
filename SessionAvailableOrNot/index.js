let todayStatus = true;
module.exports = async function (context, myTimer) {
    const axios = require('axios');
    const nodemailer = require('nodemailer');
    let result;

    if (myTimer.IsPastDue)
    {
        context.log('JavaScript is running late!');
    }
    context.log('==========================================');
    context.log('Current time: ', new Date().getSeconds());

    const sendGmail = async (sessions) => {

        try {
            let mailTransporter = await nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'a@gmail.com',
                    pass: 'password'
                }
            });

            let mailDetails = {
                from: 'from_email_address@gmail.com',
                to: ['to_email_address@gmail.com', 'to_email_address2@gmail.com'].toString(),
                subject: '💉 Vaccine is available now  💉',
                text: '* Vaccine is available *',
                html: `VACCINATION ALERT<br>
                    Vaccine is available now at different centers of Surat<br>
                    Below are sessions details<br>
                    Total ${sessions.length} sessions are available<br>
                    ${sessions.map(i => `
                        <br>
                        ===================================================<br><br>
                        Center_id: ${i.center_id}<br>
                        Name: ${i.name}<br>
                        Address: ${i.address}<br>
                        State_name: ${i.state_name}<br>
                        District_name: ${i.district_name}<br>
                        Block_name: ${i.block_name}<br>
                        Pincode: ${i.pincode}<br>
                        From: ${i.from}<br>
                        To: ${i.to}<br>
                        Latitude: ${i.lat}<br>
                        Longtitude: ${i.long}<br>
                        Fee_type: ${i.fee_type}<br>
                        Session_id: ${i.session_id}<br>
                        Date: ${i.date}<br>
                        Available_capacity_dose1: ${i.available_capacity_dose1}<br>
                        Available_capacity_dose2: ${i.available_capacity_dose2}<br>
                        Available_capacity: ${i.available_capacity}<br>
                        Fee: ${i.fee}<br>
                        Min_age_limit: ${i.min_age_limit}<br>
                        Vaccine: ${i.vaccine}<br>
                        Slots: ${JSON.stringify(i.slots)}
                    `)}
                `
            };

            let mailResult = await mailTransporter.sendMail(mailDetails);
            if(mailResult)
            {
                console.log('Email sent successfully');
                return 'Vaccine is available now. Email sent to you for sessions details'
            }

        } catch (error) {
            console.log('Error Occurs', error);
            return 'Could not send email';
        }
    };

    const checkSessionAvailable = async () => {
        let today = new Date();
        let tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        let todayFormat = today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear();
        let tomorrowFormat = tomorrow.getDate() + '-' + (tomorrow.getMonth() + 1).toString() + '-' + tomorrow.getFullYear();

        let url = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?district_id=776&date=
        ${todayStatus ? todayFormat : tomorrowFormat}`;

        console.log("Time:", todayStatus ? todayFormat : tomorrowFormat);

        var config = {
            method: 'get',
            url: url,
            headers: {'x-api-key': '3sjOr2rmM52GzhpMHjDEE1kpQeRxwFDr4YcBEimi'}
        };
        config.headers = Object.assign({...config.headers, "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36"});

        await axios(config)
            .then(async function (response) {
                let sessions = response.data.sessions;
                if(sessions.length > 1)
                {
                    let availableSessions = [];
                    sessions.map(i => {
                        if(i.available_capacity > 0 || i.available_capacity_dose1 > 0 || i.available_capacity_dose2 > 0)
                            availableSessions.push(i);
                    });
                    if(availableSessions.length > 0)
                    {
                        console.log('!! Session is available !!\n!! Now sending email !!')
                        result = await sendGmail(availableSessions);
                    }
                    else {
                        result = '!! Session is not available !!';
                        context.log(result)
                    }
                }
                else {
                    result = '!! Empty session !!';
                    context.log(result)
                }
                todayStatus = !todayStatus;
            })
            .catch(function (error) {
                result = '!! Problem to fetch data from CowinAPI !!';
                context.log("Error calling api of session", error.message);
            });
    };

    await checkSessionAvailable();
};
