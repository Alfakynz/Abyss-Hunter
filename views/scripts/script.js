function inverse() {
  const login = document.getElementById('login');
  const signup = document.getElementById('signup');
  if (login.style.display === 'none') {
    login.style.display = 'block';
    signup.style.display = 'none';
  } else {
    login.style.display = 'none';
    signup.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', function () {
  var signColor = document.getElementById('signColor');
    signColor.addEventListener('change', function() {
      var color = signColor.value;
      var colorInverse = inverseColor(color);
      signColor.style.backgroundColor = color;
      signColor.style.color = colorInverse;
  });
});

function inverseColor(colorHex) {
  var colorDecimal = parseInt(colorHex.slice(1), 16);

  var inverseDecimal = ~colorDecimal & 0xFFFFFF;
  var inverseHex = '#' + ('000000' + inverseDecimal.toString(16)).slice(-6);

  return inverseHex;
}