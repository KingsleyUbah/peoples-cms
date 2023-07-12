// Makes sure an authenticated  user doesn't access login and register routes if still signed in

const checkGuest = async (req, res, next) => {
    if(req.session && req.session.userID) {
        return res.redirect('home')
    }

    next()
}

module.exports = checkGuest