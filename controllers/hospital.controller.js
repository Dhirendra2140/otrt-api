const Hospital = require('../models/hospital');
const CircularJSON = require('circular-json');


exports.saveHospital =  (req, res) => {
  try{
  const hospital = new Hospital(req.body);
   hospital.save( (err , result)=>{
    if(err) {
      console.log(" error  ==== ", err );
      res.json({ err });
    } else {
      console.log('Saved' , result);
      res.json({result});
    }
  });

} catch {
   res.status(500).send("Internal Server Error !");
  }
},

exports.getAll = async (req, res) => {
try{
  let list = await Hospital.find();

  const str = CircularJSON.stringify(list);

  res.send(JSON.parse(str));
} catch(err) {
  console.log(err);
  res.status(500).send("internal server error!!")
 }
},

exports.updateById = async (req, res) => {
  try{  
   console.log(" params =====>>>> ", req.params.id)
   const Hospitalcode = req.body.id;
  let updated = await Hospital.findByIdAndUpdate( Hospitalcode, req.params.id, (err, result) => {
      if(err) {
        res.status(404).send("Not updated");
      } else {
        res.status(204).send("Updated ...");
      }
  });

  } catch(err) {
    res.status(404).send("Internal Server Error!");
  }
}