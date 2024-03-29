import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Field, Form } from 'formik';
import axios from 'axios';

type PropType = {
    url_prefix: string;
    setName: any;
};

const Login = ({ url_prefix, setName }: PropType) => {
    let navigate = useNavigate();
    const [error, setError] = useState('');
    return (
        <div style={{ fontSize: 'x-large' }}>
            <h1>Login</h1>
            {error}
            <Formik
                initialValues={{ email: '', password: '' }}
                onSubmit={async (values) => {
                    const { email, password } = values;
                    const res = await axios.post(
                        `${url_prefix}/users/login`,
                        {
                            email,
                            password,
                        },
                        { withCredentials: true }
                    );
                    if (res.data.error) {
                        setError('Login failed');
                    } else {
                        console.log(res.data);
                        setName(res.data.name);
                        navigate('/home');
                    }
                }}
            >
                <Form>
                    Email: <Field name='email' type='email' />
                    <br></br>
                    Password: <Field name='password' type='password' />
                    <br></br>
                    <button type='submit'>Submit</button>
                </Form>
            </Formik>

            <Link to='/'>Landing</Link>
            <br></br>
        </div>
    );
};

export default Login;
