import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors())
app.use(express.json())

const users = [
  { name: 'Misael', password: 'misael18' },
  { name: 'Yassin', password: 'yassin18' },
  {name: 'Marcel', password: 'marcel18' },
  {name: 'Maik', password: 'maik18'},
  {name: 'Stanislav', password: 'stanislav18'},
  {name: 'Andre', password: 'Andre19'}
  
]

app.get('/', (req, res) => {
  res.json({ message: 'KRATTY backend werkt!' })
})

app.post('/login', (req, res) => {
  const { name, password } = req.body

  const match = users.find(
    (user) =>
      user.name.toLowerCase() === String(name).trim().toLowerCase() &&
      user.password === password
  )

  if (!match) {
    return res.status(401).json({ error: 'Onjuiste naam of wachtwoord' })
  }

  res.json({ name: match.name })
})

app.listen(3000, () => {
  console.log('Server draait op http://localhost:3000')
})