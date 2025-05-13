

let index = async (req, res) => {
    res.status(500).json(
        {
            success: true, 
            message: 'api Server Running',
        }
    );
};


module.exports = {
   index
}