
const manualPdfFileValidator = (req, res, next) => {
    if (!req.files || !req.files.pdfLink || req.files.pdfLink.length === 0) {
        return res.status(400).json({
            errors: [
                {
                    type: "field",
                    msg: "Book pdfLink is required",
                    path: "pdfLink",
                    location: "body",
                },
            ],
        });
    }

    next();
};
const manualImageCoverValidator = (req, res, next) => {
    if (!req.files || !req.files.imageCover || req.files.imageCover.length === 0) {
        return res.status(400).json({
            errors: [
                {
                    type: "field",
                    msg: "Book imageCover is required",
                    path: "imageCover",
                    location: "body",
                },
            ],
        });
    }

    next();
};

module.exports = {
    manualPdfFileValidator,
    manualImageCoverValidator,
};