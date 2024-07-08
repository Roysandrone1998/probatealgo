const nodemailer = require('nodemailer');

class MailingRepository {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail', 
            port: 587,
            auth: {
                user: 'raysandrone@gmail.com',
                pass: 'vwni ytfw ewwd ntlk'
            }
        });
    }

    async sendInactiveDeletionEmails(users) {
        const sendEmailPromises = users.map(user => {
            const mailOptions = {
                from: 'raysandrone@gmail.com',
                to: user.email,
                subject: 'Cuenta Eliminada por Inactividad',
                text: `Hola ${user.first_name}, tu cuenta ha sido eliminada por inactividad.`
            };
            return this.transporter.sendMail(mailOptions);
        });

        return Promise.all(sendEmailPromises);
    }
}

module.exports = MailingRepository;