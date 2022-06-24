import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Header from "./Header";
import Main from "./Main";
import Footer from "./Footer";
import PopupWithForm from "./PopupWithForm";
import ImagePopup from "./ImagePopup";
import { api } from "../utils/api";
import { CurrentUserContext } from "../contexts/CurrentUserContext";
import EditProfilePopup from "./EditProfilePopup";
import EditAvatarPopup from "./EditAvatarPopup";
import AddPlacePopup from "./AddPlacePopup";
import Login from "./Login";
import Register from "./Register";
import ProtectedRoute from "./ProtectedRoute";
import * as auth from "../utils/auth";
import InfoToolTip from "./InfoToolTip";

function App() {
  const [isEditProfilePopupOpen, toggleEditProfile] = React.useState(false);
  const [isAddPlacePopupOpen, toggleAddPlace] = React.useState(false);
  const [isEditAvatarPopupOpen, toggleEditAvatar] = React.useState(false);
  const [selectedCard, setCard] = React.useState({});
  const [currentUser, setCurrentUser] = React.useState({});
  const [isInfoTooltipOpen, toggleInfoToolTip] = React.useState(false);
  const [loggedIn, setLoggedIn] = React.useState(false);
  const navigate = useNavigate();
  const [cards, setCards] = React.useState([]);
  const [headerMail, setHeaderMail] = React.useState(" ");
  const [toolTipMessage, setToolTipMessage] = React.useState(true);

  React.useEffect(() => {
    handleTokenCheck()
  }, [])

  React.useEffect(() => {
    if (loggedIn) {
      navigate("/");
      Promise.all([api.getProfile(), api.getInitialCards()]).then(([profile, initialCards]) => {
        setCurrentUser(profile);
        setCards(initialCards);
      }).catch((err) => {
        console.log(err);
      });
    }

  }, [loggedIn]);

  function handleTokenCheck() {
    const token = localStorage.getItem("jwt");
    if(token) {
      auth
          .tokenCheck(token)
          .then((res) => {
            if (res) {
              setHeaderMail(res.email);
              setCurrentUser(res)
              setLoggedIn(true);
            }
          })
          .catch((err) => {
            console.log(err);
          });
    }
  }

  function openProfilePopup() {
    toggleEditProfile(true);
  }

  function openPlacePopup() {
    toggleAddPlace(true);
  }

  function openAvatarPopup() {
    toggleEditAvatar(true);
  }

  function handleCardClick(card) {
    setCard(card);
  }

  function closeAllPopups() {
    toggleEditProfile(false);
    toggleAddPlace(false);
    toggleEditAvatar(false);
    setCard({});
    toggleInfoToolTip(false);
  }

  function handleUpdateUser({ name, about }) {
    api
      .setUserInfo(name, about)
      .then((res) => {
        setCurrentUser(res.data);
        closeAllPopups();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function handleUpdateAvatar({ avatar }) {
    api
      .setUserAvatar(avatar)
      .then((res) => {
        setCurrentUser(res);
        closeAllPopups();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function handleCardLike(card) {
    console.log(card)
    const isLiked = card.likes.some((i) => i === currentUser._id);
    api
      .changeLikeCardStatus(card._id, !isLiked)
      .then((newCard) => {
        setCards((state) =>
          state.map((c) => (c._id === card._id ? newCard : c))
        );
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function handleCardDelete(card) {
    const isOwned = cards.some((i) => i._id === currentUser._id);
    api
      .deleteCard(card._id, !isOwned)
      .then(() => {
        setCards((state) => state.filter((c) => c._id !== card._id));
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function handleAddPlaceSubmit({ name, link }) {
    api
      .addCard(name, link)
      .then((newCard) => {
        setCards([newCard, ...cards]);
        closeAllPopups();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function handleRegistrationSubmit({ password, email }) {
    auth
      .register(password, email)
      .then((res) => {
        toggleInfoToolTip(true);
        if (res) {
          setToolTipMessage(true);
          navigate("/signin");
        }
      })
      .catch((err) => {
        console.log(err);
        setToolTipMessage(false);
        toggleInfoToolTip(true);
      });
  }

  function handleLoginSubmit({ password, email }) {
    auth
      .login(password, email)
      .then((res) => {
        if (res) {
          setLoggedIn(true);
          setHeaderMail(email);
          navigate("/");
          localStorage.setItem("jwt", res.token);
        }
      })
      .catch((err) => {
        setToolTipMessage(false);
        toggleInfoToolTip(true);
        console.log(err);
      });
  }



  function logout() {
    navigate("/signin");
    setLoggedIn(false);
    localStorage.removeItem('jwt')
  }

  return (
    <CurrentUserContext.Provider value={currentUser}>
      <div className="page">
        <Header email={headerMail} onLogout={logout} />
        <Routes>
          <Route
            path="/signin"
            element={<Login onLogin={handleLoginSubmit} />}
          ></Route>
          <Route
            path="/signup"
            element={<Register onRegister={handleRegistrationSubmit} />}
          ></Route>
          <Route
            element={<ProtectedRoute isLoggedIn={loggedIn}></ProtectedRoute>}
          >
            <Route
              exact
              path="/"
              element={
                <Main
                  onEditProfile={openProfilePopup}
                  onEditAvatar={openAvatarPopup}
                  onAddPlace={openPlacePopup}
                  onCardClick={handleCardClick}
                  cards={cards}
                  onCardLike={handleCardLike}
                  onCardDelete={handleCardDelete}
                ></Main>
              }
            ></Route>
          </Route>
        </Routes>
        <Footer />
        <EditProfilePopup
          isOpen={isEditProfilePopupOpen}
          onClose={closeAllPopups}
          onUpdateUser={handleUpdateUser}
        />
        <AddPlacePopup
          isOpen={isAddPlacePopupOpen}
          onClose={closeAllPopups}
          onAddPlace={handleAddPlaceSubmit}
        />
        <PopupWithForm
          name="delete"
          title="Вы уверены?"
          onClose={closeAllPopups}
          buttonTitle="Да"
        ></PopupWithForm>
        <InfoToolTip
          onClose={closeAllPopups}
          isOpen={isInfoTooltipOpen}
          message={toolTipMessage}
        />
        <ImagePopup card={selectedCard} onClose={closeAllPopups} />
        <EditAvatarPopup
          onClose={closeAllPopups}
          isOpen={isEditAvatarPopupOpen}
          onUpdateAvatar={handleUpdateAvatar}
        />
      </div>
    </CurrentUserContext.Provider>
  );
}

export default App;
