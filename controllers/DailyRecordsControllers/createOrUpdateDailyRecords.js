export const createOrUpdateDailyRecord = async (req, res) => {
  const { minutesUpdate } = req.body;
  const { userId, categoryId } = req.params; // Asumimos que userId se pasa por params

  const errorList = validateDailyRecord({
    userId,
    categoryId,
    minutesUpdate,
    date: req.body.date,
  });

  if (errorList.length > 0) {
    return res.status(400).json({ success: false, errors: errorList });
  }

  try {
    // Si ya existe un registro para ese día, actualizar minutos
    const existingRecord = await DailyRecord.findOne({
      userId,
      categoryId,
      date: new Date().toISOString().split("T")[0],
    });

    if (existingRecord) {
      existingRecord.minutesUpdate += minutesUpdate; // Sumar los minutos
      await existingRecord.save();
      return res.status(200).json({ success: true, record: existingRecord });
    }

    // Si no existe, crear uno nuevo
    const newRecord = new DailyRecord({
      userId,
      categoryId,
      minutesUpdate,
      date: req.body.date || new Date(), // Si no se pasa la fecha, se usa la fecha actual
    });

    await newRecord.save();

    res.status(201).json({ success: true, record: newRecord });
  } catch (error) {
    console.error("Error creating or updating daily record: ", error);
    res
      .status(500)
      .json({ success: false, message: "Error saving record.", error });
  }
};
