// Makes sure the web user is logged in

const loginRequired = async (req, res, next) => {
    if(!req.session || !req.session.userID) {
        return res.redirect('login')
    }

    next()
}

module.exports = loginRequired