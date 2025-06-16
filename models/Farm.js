const farmSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 30,
    validate: {
      validator: (v) => /^[a-zA-Z가-힣0-9_]+$/.test(v),
      message: props => `${props.value} 은(는) 유효하지 않은 닉네임입니다.`
    }
  },
  // ...다른 필드들
});
