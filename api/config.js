module.exports = async (req, res) => {
  res.status(200).json({
    voiceIn: true,
    voiceOut: true,
    aiReady: !!process.env.AI_API_KEY,
  });
};
