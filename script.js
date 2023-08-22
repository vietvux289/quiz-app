//define the API endpoint for the quiz app
const API = "https://quiz-app-api-opyv.onrender.com";

//select DOM elements
const intro = document.querySelector("#introduction");
const attempt = document.querySelector("#attempt-quiz");
const review = document.querySelector("#review-quiz");
const questionText = document.querySelectorAll(".question-text");

//function to store user's selected answers
const storeAnswer = {};
function storeAnswers(questionId, dataChoice) {
  storeAnswer[questionId] = dataChoice;
  return storeAnswer;
}

//function to populate questions from the API
function populateQuestions() {
  fetch(`${API}/attempts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      populateQuestionOptions(data.questions, data._id);

      //add event listener to the submit button
      const btnSubmit = document.getElementById("btn-submit");
      btnSubmit.addEventListener("click", () => {
        const result = confirm("Are you sure to finish the quiz?");
        if (result) {
          checkAnswer(data._id);
          reviewResult();
        }
      });
      console.log("Confirmed!");

      function checkAnswer(param) {
        fetch(`${API}/attempts/${param}/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userAnswers: storeAnswer }),
        })
          .then((data) => data.json())
          .then(handleDisplayResult)
          .then(() => console.log("Successfully!"))
          .catch((error) => console.error("Error:", error));
      }
    });

  //function to show review quiz section
  function reviewResult() {
    const reviewSection = document.querySelector("#review-quiz");
    reviewSection.classList.remove("hidden");
    const btnSubmit = document.querySelector("#btn-submit");
    btnSubmit.parentElement.classList.add("hidden");
    document.body.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

//display result of questions
function handleDisplayResult(displayData) {
  let resultsList = {};
  let countAnsweredQuestions = Object.keys(displayData.userAnswers).length;
  if (countAnsweredQuestions > 0) {
    colorizeAnswers();
  }

  //funtion handle to put color to answer tag
  function colorizeAnswers() {
    console.log(displayData);
    for (let correctQuestId in displayData.correctAnswers) {
      if (!displayData.userAnswers.hasOwnProperty(correctQuestId)) {
        displayData.userAnswers[correctQuestId] = undefined;
      }

      if (
        correctQuestId in displayData.userAnswers &&
        displayData.correctAnswers[correctQuestId] == displayData.userAnswers[correctQuestId]
      ) {
        resultsList[correctQuestId] = true;
      } else {
        resultsList[correctQuestId] = false;
      }
    }
  }
  renderThirdScreen();

  //function to handle displaying quiz results
  function renderThirdScreen() {
    const resultFeedback = document.querySelector(".result-feedback");
    const resultScore = document.querySelector(".result-score");
    const resultPercentage = document.querySelector(".result-percentage");

    resultScore.textContent = `${displayData.score} / 10`;
    resultPercentage.textContent = `${displayData.score * 10}%`;
    resultFeedback.textContent = displayData.scoreText;

    for (const questionId in displayData.correctAnswers) {
      const questionElement = document.getElementById(questionId);
      const selectedAnswer = questionElement.nextElementSibling.querySelector(".option");
      const answerOptionsContainer = selectedAnswer.parentElement;
      const answerOptions = answerOptionsContainer.querySelectorAll(".option");

      const isCorrectAnswer = resultsList[questionId];
      const isUserAnswered = displayData.userAnswers[questionId] !== undefined;

      if (isUserAnswered) {
        const answerStatus = document.createElement("span");
        answerStatus.classList.add("answer-status");

        if (isCorrectAnswer) {
          answerStatus.textContent = "Correct answer";
          answerOptions[displayData.userAnswers[questionId]].classList.add("correct-answer");
        } else {
          answerStatus.textContent = "Your answer";
          answerOptions[displayData.userAnswers[questionId]].classList.add("wrong-answer");

          const correctAnswerStatus = document.createElement("span");
          correctAnswerStatus.classList.add("answer-status");
          correctAnswerStatus.textContent = "Correct answer";
          answerOptions[displayData.correctAnswers[questionId]].classList.add("option-correct");
          answerOptions[displayData.correctAnswers[questionId]].appendChild(correctAnswerStatus);
        }
        answerOptions[displayData.userAnswers[questionId]].appendChild(answerStatus);
      } else {
        answerOptions[displayData.correctAnswers[questionId]].classList.add("option-correct");
        const answerStatus = document.createElement("span");
        answerStatus.classList.add("answer-status");
        answerStatus.textContent = "Correct answer";
        answerOptions[displayData.correctAnswers[questionId]].appendChild(answerStatus);
      }
      answerOptions.forEach((option) => {
        option.firstElementChild.disabled = true;
        option.style.cursor = "default";
      });
    }
    return displayData;
  }
}
populateQuestions();

//function to fill questions with data
let answersSet = [];
function populateQuestionOptions(datas, idAttempts) {
  let questionDataArray = datas.map((data) => data);
  numberOfQuestions = questionDataArray.length;
  questionDataArray.forEach((question) => answersSet.push(question.answers));

  let answerHTMLArray = [];
  //handle show answers
  function generateAnswerHTML(answersSet) {
    answersSet.forEach((answerKey, i) => {
      const answerOptionHTML = answerKey.map(
        (individualAnswer, index) =>
          `<label class="option">
                    <input data-answer="${index}" type="radio" data-foranswer=${i} name="radio-${i}" class="radio-container">
                    <span class="option-text"><xmp>${individualAnswer}</xmp></span>
                </label>`
      );
      answerHTMLArray.push(answerOptionHTML);
    });
  }
  generateAnswerHTML(answersSet);

  questionDataArray.forEach((question, index) => {
    attempt.appendChild(
      createQuestions(index + 1, numberOfQuestions, question.text, question._id, answerHTMLArray[index])
    );

    let questionText = document.querySelectorAll(".question-text");
    function clickAnswer() {
      let optButtons = document.querySelectorAll(".radio-container");
      //function handle click to the answer review
      function handleAnswerClick() {
        let parentElement = this.parentElement.parentElement;
        let selectedOption = parentElement.querySelector(".option.option-selected");

        if (selectedOption) {
          if (
            selectedOption.firstElementChild.getAttribute("name") == this.getAttribute("name")
          ) {
            selectedOption.classList.remove("option-selected");
            selectedOption.firstElementChild.removeAttribute("data-ticked");
          }
        }

        let parentColor = this.parentElement;
        parentColor.classList.add("option-selected");

        let questionId = questionText[this.dataset.foranswer].getAttribute("id");
        this.setAttribute("data-ticked", this.dataset.answer);

        let dataChoice = this.dataset.answer;
        let checkAnswer = storeAnswers(questionId, dataChoice);
        console.log(questionId, dataChoice);
      }

      optButtons.forEach((optButton) => {
        optButton.onclick = handleAnswerClick;
      });
    }

    clickAnswer();
  });

  let submitAnswer = (() => {
    let btnContainer = document.createElement("div");
    btnContainer.classList.add("boxes");
    let btnSubmit = document.createElement("button");
    btnSubmit.id = "btn-submit";
    btnSubmit.className = "buttons btn_green";
    btnSubmit.textContent = "Submit your answers ❯";
    btnContainer.appendChild(btnSubmit);
    return btnContainer;
  })();
  attempt.appendChild(submitAnswer.cloneNode(true));

  //hide intro section to show attempt section
  const btnStart = document.querySelector("#btn-start");
  btnStart.addEventListener("click", () => {
    intro.classList.add("hidden");
    attempt.classList.remove("hidden");
    document.body.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

//function to create question elements
function createQuestions(arranged, total, textData, questionIndex, keyAnswers) {
  let questionContainer = document.createElement("div");
  let elementQuestionIndex = document.createElement("h2");
  let questionText = document.createElement("div");
  let elementOptions = document.createElement("div");

  questionContainer.classList.add("question-container");
  elementQuestionIndex.classList.add("question-index");
  questionText.classList.add("question-text");
  elementOptions.classList.add("option-list");

  questionText.innerText = `${textData}`;
  questionText.setAttribute("id", questionIndex);
  elementQuestionIndex.innerText = `Question ${arranged} of ${total}`;
  elementOptions.innerHTML = keyAnswers.join(" ");

  questionContainer.appendChild(elementQuestionIndex);
  questionContainer.appendChild(questionText);
  questionContainer.appendChild(elementOptions);

  return questionContainer;
}

//event listener for trying the quiz again
const btnRedo = document.querySelector("#btn-try-again");
btnRedo.addEventListener("click", () => {
  document.location.reload();
  document.body.scrollIntoView({ behavior: "smooth", block: "start" });
});
