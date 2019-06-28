import config from "../util/config.js";
const sgMail = config.sendgridInit(); // Sendgrid

function sendDonorThankYouEmail(donorInfo) {
    // Send donor thank-you email
    // Takes in donorInfo object with "email", "firstName" fields
    const msg = {
        to: donorInfo.email,
        from: "duet@giveduet.org",
        templateId: "d-2780c6e3d4f3427ebd0b20bbbf2f8cfc",
        dynamic_template_data: {
            name: donorInfo.firstName
        }
    };

    sgMail
        .send(msg)
        .then(() => {
            console.log(`Donation confirmation sent ${donorInfo.email} to successfully.`);
        })
        .catch(error => {
            console.error(error.toString());
        });
}

async function sendTypeformErrorEmail(typeformErrorInfo) {
    msg = {
        to: "duet.giving@gmail.com",
        from: "duet.giving@gmail.com",
        templateId: "d-6ecc5d7df32c4528b8527c248a212552",
        dynamic_template_data: {
            formTitle: typeformErrorInfo.formTitle,
            eventId: typeformErrorInfo.eventId,
            error: typeformErrorInfo.err
        }
    }
    sgMail
        .send(msg)
        .then(() => {
            console.log("Sendgrid error message delived successfully.");
        })
        .catch(error => {
            console.error(error.toString());
        });
}

async function sendStoreNotificationEmail(storeNotificationInfo) {
    let subject;
    if (process.env.STORE_NOTIFICATION_BEHAVIOR === 'sandbox') {
        subject = "[SANDBOX] Duet: The following items need your attention!";
    } else {
        subject = "Duet: The following items need your attention!";
    }
    
    const msg = {
        to: storeNotificationInfo.recipientList,
        from: "duet@giveduet.org",
        templateId: "d-435a092f0be54b07b5135799ac7dfb01",
        dynamic_template_data: {
            storeName: storeNotificationInfo.name,
            items: storeNotificationInfo.updatedItems,
            subject: subject
        }
    };

    sgMail
        .sendMultiple(msg)
        .then(() => {
            console.log(`Message delivered to ${storeNotificationInfo.name} at ${storeNotificationInfo.email} successfully.`);
        })
        .catch(error => {
            console.error("Error: " + error.toString());
            return;
        });
}

export default {
    sendDonorThankYouEmail,
    sendStoreNotificationEmail,
    sendTypeformErrorEmail
}